import type { FastifyInstance } from 'fastify';
import type {
  CreateOutgoingOrderRequest,
  UpdateOutgoingOrderRequest,
  OutgoingOrderResponse,
  OutgoingOrderListResponse,
  VarietySnapshotInput,
  BagSizeSnapshotInput,
} from '../types/outgoing-order.js';
import type { Prisma } from '../../../../../../generated/prisma/client.js';
import {
  getLatestOrderCurrentStock,
  calculateQuantityRemovedFromVarieties,
  recalculateStockAfterOrder,
} from '../../../incoming-orders/v1/services/helpers.js';

/**
 * Type definitions for Prisma variety structures
 */
interface IncomingVariety {
  name: string;
  bagSizes?: Array<{
    name: string;
    locationId: string;
    quantityCurr?: number;
  }>;
}

interface OutgoingVariety {
  name: string;
  bagSizes?: Array<{
    name: string;
    locationId: string;
    varietyName: string;
    quantityRemoved?: number;
  }>;
}

/**
 * Custom error classes for business logic
 */
export class OutgoingOrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Outgoing order with id ${id} not found`);
    this.name = 'OutgoingOrderNotFoundError';
  }
}

export class OutgoingOrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutgoingOrderValidationError';
  }
}

/**
 * Service layer for OutgoingOrder
 * Contains business logic for creating outgoing orders
 */
export class OutgoingOrderService {
  private readonly fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Create a new outgoing order
   */
  async create(
    data: CreateOutgoingOrderRequest,
    adminId: string,
    coldStorageId: string
  ): Promise<OutgoingOrderResponse> {
    // Validate required fields
    if (!data.farmerStorageLinkId || !data.commodity || data.gatePassNumber === undefined) {
      throw new OutgoingOrderValidationError(
        'farmerStorageLinkId, commodity, and gatePassNumber are required'
      );
    }

    // If varieties are provided, validate their structure
    if (data.varieties !== undefined && data.varieties !== null) {
      if (!Array.isArray(data.varieties) || data.varieties.length === 0) {
        throw new OutgoingOrderValidationError('varieties must be a non-empty array if provided');
      }

      // Validate each variety has bagSizes
      for (const variety of data.varieties) {
        if (!variety.name || !Array.isArray(variety.bagSizes) || variety.bagSizes.length === 0) {
          throw new OutgoingOrderValidationError(
            'Each variety must have a name and non-empty bagSizes array'
          );
        }

        // Validate each bagSize has required fields
        for (const bagSize of variety.bagSizes) {
          if (
            !bagSize.incomingOrderId ||
            !bagSize.varietyName ||
            !bagSize.name ||
            !bagSize.locationId ||
            bagSize.quantityBefore === undefined ||
            bagSize.quantityRemoved === undefined ||
            bagSize.quantityAfter === undefined
          ) {
            throw new OutgoingOrderValidationError(
              'Each bagSize must have incomingOrderId, varietyName, name, locationId, quantityBefore, quantityRemoved, and quantityAfter'
            );
          }

          // Validate quantityAfter = quantityBefore - quantityRemoved
          if (bagSize.quantityAfter !== bagSize.quantityBefore - bagSize.quantityRemoved) {
            throw new OutgoingOrderValidationError(
              `quantityAfter must equal quantityBefore - quantityRemoved for bagSize ${bagSize.name}`
            );
          }

          // Validate quantityRemoved is positive
          if (bagSize.quantityRemoved <= 0) {
            throw new OutgoingOrderValidationError(
              `quantityRemoved must be positive for bagSize ${bagSize.name}`
            );
          }

          // Validate quantityRemoved doesn't exceed quantityBefore
          if (bagSize.quantityRemoved > bagSize.quantityBefore) {
            throw new OutgoingOrderValidationError(
              `quantityRemoved cannot exceed quantityBefore for bagSize ${bagSize.name}`
            );
          }
        }
      }
    }

    // Verify farmer storage link belongs to admin's cold storage
    const link = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: { id: data.farmerStorageLinkId },
    });

    if (!link || link.coldStorageId !== coldStorageId) {
      throw new OutgoingOrderValidationError('Invalid farmer storage link');
    }

    // Process varieties and validate commodity consistency
    // For null vouchers, varieties will be empty array
    let processedVarieties: VarietySnapshotInput[] = [];
    const allIncomingOrderIds: string[] = [];

    if (data.varieties && Array.isArray(data.varieties) && data.varieties.length > 0) {
      // Collect all incoming order IDs
      for (const variety of data.varieties) {
        for (const bagSize of variety.bagSizes) {
          if (!allIncomingOrderIds.includes(bagSize.incomingOrderId)) {
            allIncomingOrderIds.push(bagSize.incomingOrderId);
          }
        }
      }

      // Fetch all incoming orders to validate they exist, belong to the cold storage, and have the same commodity
      const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
        where: {
          id: { in: allIncomingOrderIds },
          coldStorageId,
        },
        select: {
          id: true,
          commodity: true,
          varieties: true,
        },
      });

      // Check if all incoming orders were found
      if (incomingOrders.length !== allIncomingOrderIds.length) {
        throw new OutgoingOrderValidationError(
          "One or more incoming orders not found or don't belong to your cold storage"
        );
      }

      // Validate all incoming orders have the same commodity as the outgoing order
      const uniqueCommodities = new Set(incomingOrders.map((order) => order.commodity));
      if (uniqueCommodities.size > 1 || !uniqueCommodities.has(data.commodity)) {
        throw new OutgoingOrderValidationError(
          'All incoming orders must have the same commodity as the outgoing order. Cannot mix commodities.'
        );
      }

      // Validate stock availability and build VarietySnapshot structure
      // Create a map to track available stock by locationId_varietyName_bagSizeName
      const stockMap = new Map<string, number>();

      // First, calculate current stock from all incoming orders (only for this commodity)
      const allIncomingOrdersForCommodity = await this.fastify.prisma.incomingOrder.findMany({
        where: {
          coldStorageId,
          commodity: data.commodity,
        },
        select: {
          varieties: true,
        },
      });

      // Add quantities from incoming orders
      for (const order of allIncomingOrdersForCommodity) {
        if (!order.varieties || !Array.isArray(order.varieties) || order.varieties.length === 0) {
          continue; // Skip null vouchers
        }

        for (const variety of order.varieties as IncomingVariety[]) {
          const varietyName = variety.name;
          if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
            for (const bagSize of variety.bagSizes) {
              const locationId = bagSize.locationId;
              const bagSizeName = bagSize.name;
              const quantity = bagSize.quantityCurr || 0;
              const key = `${locationId}_${varietyName}_${bagSizeName}`;
              const currentStock = stockMap.get(key) || 0;
              stockMap.set(key, currentStock + quantity);
            }
          }
        }
      }

      // Subtract quantities from existing outgoing orders
      const allOutgoingOrdersForCommodity = await this.fastify.prisma.outgoingOrder.findMany({
        where: {
          coldStorageId,
          commodity: data.commodity,
        },
        select: {
          varieties: true,
        },
      });

      for (const order of allOutgoingOrdersForCommodity) {
        if (!order.varieties || !Array.isArray(order.varieties) || order.varieties.length === 0) {
          continue; // Skip null vouchers
        }

        for (const variety of order.varieties as OutgoingVariety[]) {
          if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
            for (const bagSize of variety.bagSizes) {
              const locationId = bagSize.locationId;
              const varietyNameFromSnapshot = bagSize.varietyName;
              const bagSizeName = bagSize.name;
              const quantityRemoved = bagSize.quantityRemoved || 0;
              const key = `${locationId}_${varietyNameFromSnapshot}_${bagSizeName}`;
              const currentStock = stockMap.get(key) || 0;
              stockMap.set(key, Math.max(0, currentStock - quantityRemoved));
            }
          }
        }
      }

      // Now validate that the quantities being removed are available
      // and build the processed varieties structure
      processedVarieties = data.varieties.map((variety) => {
        const processedBagSizes = variety.bagSizes.map((bagSize) => {
          // Validate the incoming order contains this bagSize
          const incomingOrder = incomingOrders.find((io) => io.id === bagSize.incomingOrderId);
          if (!incomingOrder) {
            throw new OutgoingOrderValidationError(
              `Incoming order ${bagSize.incomingOrderId} not found`
            );
          }

          // Verify the incoming order has this variety and bagSize
          let foundInIncoming = false;
          let incomingBagSize: { quantityCurr?: number } | null = null;

          if (incomingOrder.varieties && Array.isArray(incomingOrder.varieties)) {
            for (const invVariety of incomingOrder.varieties as IncomingVariety[]) {
              if (invVariety.name === bagSize.varietyName) {
                if (invVariety.bagSizes && Array.isArray(invVariety.bagSizes)) {
                  for (const invBagSize of invVariety.bagSizes) {
                    if (
                      invBagSize.name === bagSize.name &&
                      invBagSize.locationId === bagSize.locationId
                    ) {
                      foundInIncoming = true;
                      incomingBagSize = invBagSize;
                      break;
                    }
                  }
                }
                if (foundInIncoming) break;
              }
            }
          }

          if (!foundInIncoming || !incomingBagSize) {
            throw new OutgoingOrderValidationError(
              `BagSize ${bagSize.name} for variety ${bagSize.varietyName} not found in incoming order ${bagSize.incomingOrderId}`
            );
          }

          // Validate quantityBefore matches quantityCurr in incoming order
          const incomingQuantityCurr = incomingBagSize.quantityCurr ?? 0;
          if (Math.abs(incomingQuantityCurr - bagSize.quantityBefore) > 0.01) {
            throw new OutgoingOrderValidationError(
              `quantityBefore (${bagSize.quantityBefore}) doesn't match available quantity (${incomingQuantityCurr}) in incoming order ${bagSize.incomingOrderId}`
            );
          }

          // Validate stock availability - check if quantityRemoved doesn't exceed what's available
          const stockKey = `${bagSize.locationId}_${bagSize.varietyName}_${bagSize.name}`;
          const availableStock = stockMap.get(stockKey) || 0;
          if (bagSize.quantityRemoved > availableStock) {
            throw new OutgoingOrderValidationError(
              `Insufficient stock for ${bagSize.varietyName} ${bagSize.name} at location ${bagSize.locationId}. Available: ${availableStock}, Requested to remove: ${bagSize.quantityRemoved}`
            );
          }

          // Return bagSize snapshot structure
          return {
            name: bagSize.name,
            locationId: bagSize.locationId,
            incomingOrderId: bagSize.incomingOrderId,
            varietyName: bagSize.varietyName,
            quantityBefore: bagSize.quantityBefore,
            quantityRemoved: bagSize.quantityRemoved,
            quantityAfter: bagSize.quantityAfter,
            approxWeight: bagSize.approxWeight,
          } as BagSizeSnapshotInput;
        });

        return {
          name: variety.name,
          bagSizes: processedBagSizes,
        };
      });
    }

    // Calculate currentStockAtThatTime for the new order
    // For null vouchers, don't change stock - use latest stock value
    let finalCurrentStock = data.currentStockAtThatTime;

    if (processedVarieties && processedVarieties.length > 0) {
      // Get the latest order's currentStockAtThatTime value for this commodity
      const latestStock = await getLatestOrderCurrentStock(
        this.fastify,
        coldStorageId,
        data.commodity
      );

      // Calculate total quantity removed from the new outgoing order
      const quantityRemoved = calculateQuantityRemovedFromVarieties(
        processedVarieties as Array<{ bagSizes?: Array<{ quantityRemoved?: number }> }>
      );

      // For outgoing order: subtract the removed quantities from the latest stock
      const calculatedCurrentStock = Math.max(0, latestStock - quantityRemoved);

      // Use provided currentStockAtThatTime if given, otherwise use calculated value
      finalCurrentStock =
        data.currentStockAtThatTime !== undefined
          ? data.currentStockAtThatTime
          : calculatedCurrentStock;
    } else if (data.currentStockAtThatTime === undefined) {
      // For null vouchers, use latest stock if not explicitly provided
      finalCurrentStock = await getLatestOrderCurrentStock(
        this.fastify,
        coldStorageId,
        data.commodity
      );
    }

    // Update incoming orders' quantityCurr values before creating outgoing order
    if (processedVarieties && processedVarieties.length > 0) {
      // Group bagSizes by incomingOrderId to update each order once
      const updatesByIncomingOrder = new Map<
        string,
        Array<{
          varietyName: string;
          bagSizeName: string;
          locationId: string;
          quantityRemoved: number;
        }>
      >();

      for (const variety of processedVarieties) {
        if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
          for (const bagSize of variety.bagSizes) {
            const incomingOrderId = bagSize.incomingOrderId;
            if (!updatesByIncomingOrder.has(incomingOrderId)) {
              updatesByIncomingOrder.set(incomingOrderId, []);
            }
            const updates = updatesByIncomingOrder.get(incomingOrderId);
            if (updates) {
              updates.push({
                varietyName: bagSize.varietyName,
                bagSizeName: bagSize.name,
                locationId: bagSize.locationId,
                quantityRemoved: bagSize.quantityRemoved,
              });
            }
          }
        }
      }

      // Update each incoming order
      for (const [incomingOrderId, updates] of updatesByIncomingOrder.entries()) {
        const incomingOrder = await this.fastify.prisma.incomingOrder.findUnique({
          where: { id: incomingOrderId },
        });

        if (!incomingOrder) {
          throw new OutgoingOrderValidationError(`Incoming order ${incomingOrderId} not found`);
        }

        // Update the varieties array
        const updatedVarieties = (incomingOrder.varieties as IncomingVariety[]).map(
          (variety: IncomingVariety) => {
            // Find if this variety has any updates
            const varietyUpdates = updates.filter((update) => update.varietyName === variety.name);
            if (varietyUpdates.length === 0) {
              return variety; // No changes for this variety
            }

            // Update bagSizes in this variety
            const updatedBagSizes = (variety.bagSizes || []).map((bagSize) => {
              // Find if this bagSize has an update
              const bagSizeUpdate = varietyUpdates.find(
                (update) =>
                  update.bagSizeName === bagSize.name && update.locationId === bagSize.locationId
              );

              if (bagSizeUpdate) {
                // Reduce quantityCurr by quantityRemoved
                return {
                  ...bagSize,
                  quantityCurr: Math.max(
                    0,
                    (bagSize.quantityCurr || 0) - bagSizeUpdate.quantityRemoved
                  ),
                };
              }
              return bagSize; // No changes for this bagSize
            });

            return {
              ...variety,
              bagSizes: updatedBagSizes,
            };
          }
        );

        // Save the updated incoming order
        await this.fastify.prisma.incomingOrder.update({
          where: { id: incomingOrderId },
          data: {
            varieties: updatedVarieties,
          },
        });
      }
    }

    // Calculate totalBags and totalWeight from varieties
    let totalBags = 0.0;
    let totalWeight = 0.0;

    if (processedVarieties && processedVarieties.length > 0) {
      for (const variety of processedVarieties) {
        if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
          for (const bagSize of variety.bagSizes) {
            totalBags += bagSize.quantityRemoved || 0;
            totalWeight += (bagSize.approxWeight || 0) * (bagSize.quantityRemoved || 0);
          }
        }
      }
    }

    // Create outgoing order with processed varieties (now with VarietySnapshot structure) or empty array for null vouchers
    const order = await this.fastify.prisma.outgoingOrder.create({
      data: {
        farmerStorageLinkId: data.farmerStorageLinkId,
        coldStorageId,
        commodity: data.commodity,
        gatePassType: data.gatePassType || 'DELIVERY',
        gatePassNumber: data.gatePassNumber,
        date: data.date || null,
        remarks: data.remarks || null,
        currentStockAtThatTime: finalCurrentStock,
        paidAmount: data.paidAmount != null ? data.paidAmount : undefined,
        varieties: processedVarieties || [], // empty array for null vouchers
        totalBags: totalBags > 0 ? totalBags : undefined,
        totalWeight: totalWeight > 0 ? totalWeight : undefined,
        createdById: adminId,
      },
      include: {
        farmerStorageLink: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                address: true,
                mobileNumber: true,
                imageUrl: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const enrichedOrder = await this.enrichOrderWithLocations(order);

    return this.mapToResponse(enrichedOrder);
  }

  /**
   * Update an existing outgoing order
   */
  async update(
    id: string,
    data: UpdateOutgoingOrderRequest,
    coldStorageId: string
  ): Promise<OutgoingOrderResponse> {
    // Get existing order
    const existingOrder = await this.fastify.prisma.outgoingOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new OutgoingOrderNotFoundError(id);
    }

    if (existingOrder.coldStorageId !== coldStorageId) {
      throw new OutgoingOrderValidationError('Order does not belong to this cold storage');
    }

    // If farmerStorageLinkId is being updated, verify it belongs to cold storage
    if (data.farmerStorageLinkId) {
      const link = await this.fastify.prisma.farmerStorageLink.findUnique({
        where: { id: data.farmerStorageLinkId },
      });

      if (!link || link.coldStorageId !== coldStorageId) {
        throw new OutgoingOrderValidationError('Invalid farmer storage link');
      }
    }

    const commodity = data.commodity || existingOrder.commodity;
    const existingVarieties = (existingOrder.varieties as VarietySnapshotInput[]) || [];

    // Revert incoming order quantityCurr changes from old varieties
    if (existingVarieties.length > 0) {
      const revertUpdatesByIncomingOrder = new Map<
        string,
        Array<{
          varietyName: string;
          bagSizeName: string;
          locationId: string;
          quantityRemoved: number;
        }>
      >();

      for (const variety of existingVarieties) {
        if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
          for (const bagSize of variety.bagSizes) {
            const incomingOrderId = bagSize.incomingOrderId;
            if (!revertUpdatesByIncomingOrder.has(incomingOrderId)) {
              revertUpdatesByIncomingOrder.set(incomingOrderId, []);
            }
            const revertUpdates = revertUpdatesByIncomingOrder.get(incomingOrderId);
            if (revertUpdates) {
              revertUpdates.push({
                varietyName: bagSize.varietyName,
                bagSizeName: bagSize.name,
                locationId: bagSize.locationId,
                quantityRemoved: bagSize.quantityRemoved,
              });
            }
          }
        }
      }

      // Revert each incoming order (add back the quantityRemoved)
      for (const [incomingOrderId, revertUpdates] of revertUpdatesByIncomingOrder.entries()) {
        const incomingOrder = await this.fastify.prisma.incomingOrder.findUnique({
          where: { id: incomingOrderId },
        });

        if (!incomingOrder) {
          continue; // Skip if incoming order no longer exists
        }

        // Revert the varieties array
        const revertedVarieties = (incomingOrder.varieties as IncomingVariety[]).map(
          (variety: IncomingVariety) => {
            const varietyRevertUpdates = revertUpdates.filter(
              (update) => update.varietyName === variety.name
            );
            if (varietyRevertUpdates.length === 0) {
              return variety; // No changes for this variety
            }

            // Revert bagSizes in this variety (add back quantityRemoved)
            const revertedBagSizes = (variety.bagSizes || []).map((bagSize) => {
              const bagSizeRevertUpdate = varietyRevertUpdates.find(
                (update) =>
                  update.bagSizeName === bagSize.name && update.locationId === bagSize.locationId
              );

              if (bagSizeRevertUpdate) {
                // Add back quantityRemoved to quantityCurr
                return {
                  ...bagSize,
                  quantityCurr: (bagSize.quantityCurr || 0) + bagSizeRevertUpdate.quantityRemoved,
                };
              }
              return bagSize; // No changes for this bagSize
            });

            return {
              ...variety,
              bagSizes: revertedBagSizes,
            };
          }
        );

        // Save the reverted incoming order
        await this.fastify.prisma.incomingOrder.update({
          where: { id: incomingOrderId },
          data: {
            varieties: revertedVarieties,
          },
        });
      }
    }

    // Process new varieties if provided
    let processedVarieties: VarietySnapshotInput[] | undefined;
    let quantitiesHaveChanged = false;

    if (data.varieties !== undefined) {
      if (
        data.varieties === null ||
        (Array.isArray(data.varieties) && data.varieties.length === 0)
      ) {
        // Explicitly setting to null voucher (empty array)
        processedVarieties = [];
        quantitiesHaveChanged = existingVarieties.length > 0;
      } else if (Array.isArray(data.varieties) && data.varieties.length > 0) {
        // Validate varieties structure (same as create)
        for (const variety of data.varieties) {
          if (!variety.name || !Array.isArray(variety.bagSizes) || variety.bagSizes.length === 0) {
            throw new OutgoingOrderValidationError(
              'Each variety must have a name and non-empty bagSizes array'
            );
          }

          for (const bagSize of variety.bagSizes) {
            if (
              !bagSize.incomingOrderId ||
              !bagSize.varietyName ||
              !bagSize.name ||
              !bagSize.locationId ||
              bagSize.quantityBefore === undefined ||
              bagSize.quantityRemoved === undefined ||
              bagSize.quantityAfter === undefined
            ) {
              throw new OutgoingOrderValidationError(
                'Each bagSize must have incomingOrderId, varietyName, name, locationId, quantityBefore, quantityRemoved, and quantityAfter'
              );
            }

            if (bagSize.quantityAfter !== bagSize.quantityBefore - bagSize.quantityRemoved) {
              throw new OutgoingOrderValidationError(
                `quantityAfter must equal quantityBefore - quantityRemoved for bagSize ${bagSize.name}`
              );
            }

            if (bagSize.quantityRemoved <= 0) {
              throw new OutgoingOrderValidationError(
                `quantityRemoved must be positive for bagSize ${bagSize.name}`
              );
            }

            if (bagSize.quantityRemoved > bagSize.quantityBefore) {
              throw new OutgoingOrderValidationError(
                `quantityRemoved cannot exceed quantityBefore for bagSize ${bagSize.name}`
              );
            }
          }
        }

        // Process varieties (similar to create function)
        const allIncomingOrderIds: string[] = [];
        for (const variety of data.varieties) {
          for (const bagSize of variety.bagSizes) {
            if (!allIncomingOrderIds.includes(bagSize.incomingOrderId)) {
              allIncomingOrderIds.push(bagSize.incomingOrderId);
            }
          }
        }

        // Fetch all incoming orders to validate
        const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
          where: {
            id: { in: allIncomingOrderIds },
            coldStorageId,
          },
          select: {
            id: true,
            commodity: true,
            varieties: true,
          },
        });

        if (incomingOrders.length !== allIncomingOrderIds.length) {
          throw new OutgoingOrderValidationError(
            "One or more incoming orders not found or don't belong to your cold storage"
          );
        }

        const uniqueCommodities = new Set(incomingOrders.map((order) => order.commodity));
        if (uniqueCommodities.size > 1 || !uniqueCommodities.has(commodity)) {
          throw new OutgoingOrderValidationError(
            'All incoming orders must have the same commodity as the outgoing order. Cannot mix commodities.'
          );
        }

        // Validate stock availability and build VarietySnapshot structure
        const stockMap = new Map<string, number>();

        // Calculate current stock from all incoming orders
        const allIncomingOrdersForCommodity = await this.fastify.prisma.incomingOrder.findMany({
          where: {
            coldStorageId,
            commodity,
          },
          select: {
            varieties: true,
          },
        });

        for (const order of allIncomingOrdersForCommodity) {
          if (!order.varieties || !Array.isArray(order.varieties) || order.varieties.length === 0) {
            continue;
          }

          for (const variety of order.varieties as IncomingVariety[]) {
            const varietyName = variety.name;
            if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
              for (const bagSize of variety.bagSizes) {
                const locationId = bagSize.locationId;
                const bagSizeName = bagSize.name;
                const quantity = bagSize.quantityCurr || 0;
                const key = `${locationId}_${varietyName}_${bagSizeName}`;
                const currentStock = stockMap.get(key) || 0;
                stockMap.set(key, currentStock + quantity);
              }
            }
          }
        }

        // Subtract quantities from existing outgoing orders (excluding the one being updated)
        const allOutgoingOrdersForCommodity = await this.fastify.prisma.outgoingOrder.findMany({
          where: {
            coldStorageId,
            commodity,
            id: { not: id }, // Exclude the order being updated
          },
          select: {
            varieties: true,
          },
        });

        for (const order of allOutgoingOrdersForCommodity) {
          if (!order.varieties || !Array.isArray(order.varieties) || order.varieties.length === 0) {
            continue;
          }

          for (const variety of order.varieties as OutgoingVariety[]) {
            if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
              for (const bagSize of variety.bagSizes) {
                const locationId = bagSize.locationId;
                const varietyNameFromSnapshot = bagSize.varietyName;
                const bagSizeName = bagSize.name;
                const quantityRemoved = bagSize.quantityRemoved || 0;
                const key = `${locationId}_${varietyNameFromSnapshot}_${bagSizeName}`;
                const currentStock = stockMap.get(key) || 0;
                stockMap.set(key, Math.max(0, currentStock - quantityRemoved));
              }
            }
          }
        }

        // Build processed varieties and validate
        processedVarieties = data.varieties.map((variety) => {
          const processedBagSizes = variety.bagSizes.map((bagSize) => {
            const incomingOrder = incomingOrders.find((io) => io.id === bagSize.incomingOrderId);
            if (!incomingOrder) {
              throw new OutgoingOrderValidationError(
                `Incoming order ${bagSize.incomingOrderId} not found`
              );
            }

            let foundInIncoming = false;
            let incomingBagSize: { quantityCurr?: number } | null = null;

            if (incomingOrder.varieties && Array.isArray(incomingOrder.varieties)) {
              for (const invVariety of incomingOrder.varieties as IncomingVariety[]) {
                if (invVariety.name === bagSize.varietyName) {
                  if (invVariety.bagSizes && Array.isArray(invVariety.bagSizes)) {
                    for (const invBagSize of invVariety.bagSizes) {
                      if (
                        invBagSize.name === bagSize.name &&
                        invBagSize.locationId === bagSize.locationId
                      ) {
                        foundInIncoming = true;
                        incomingBagSize = invBagSize;
                        break;
                      }
                    }
                  }
                  if (foundInIncoming) break;
                }
              }
            }

            if (!foundInIncoming || !incomingBagSize) {
              throw new OutgoingOrderValidationError(
                `BagSize ${bagSize.name} for variety ${bagSize.varietyName} not found in incoming order ${bagSize.incomingOrderId}`
              );
            }

            const incomingQuantityCurr = incomingBagSize.quantityCurr ?? 0;
            if (Math.abs(incomingQuantityCurr - bagSize.quantityBefore) > 0.01) {
              throw new OutgoingOrderValidationError(
                `quantityBefore (${bagSize.quantityBefore}) doesn't match available quantity (${incomingQuantityCurr}) in incoming order ${bagSize.incomingOrderId}`
              );
            }

            const stockKey = `${bagSize.locationId}_${bagSize.varietyName}_${bagSize.name}`;
            const availableStock = stockMap.get(stockKey) || 0;
            if (bagSize.quantityRemoved > availableStock) {
              throw new OutgoingOrderValidationError(
                `Insufficient stock for ${bagSize.varietyName} ${bagSize.name} at location ${bagSize.locationId}. Available: ${availableStock}, Requested to remove: ${bagSize.quantityRemoved}`
              );
            }

            return {
              name: bagSize.name,
              locationId: bagSize.locationId,
              incomingOrderId: bagSize.incomingOrderId,
              varietyName: bagSize.varietyName,
              quantityBefore: bagSize.quantityBefore,
              quantityRemoved: bagSize.quantityRemoved,
              quantityAfter: bagSize.quantityAfter,
              approxWeight: bagSize.approxWeight,
            } as BagSizeSnapshotInput;
          });

          return {
            name: variety.name,
            bagSizes: processedBagSizes,
          };
        });

        // Check if quantities changed
        const oldQuantityRemoved = calculateQuantityRemovedFromVarieties(
          existingVarieties as Array<{ bagSizes?: Array<{ quantityRemoved?: number }> }>
        );
        const newQuantityRemoved = calculateQuantityRemovedFromVarieties(
          processedVarieties as Array<{ bagSizes?: Array<{ quantityRemoved?: number }> }>
        );
        quantitiesHaveChanged = oldQuantityRemoved !== newQuantityRemoved;
      }
    } else {
      // Varieties not provided in update, keep existing
      processedVarieties = existingVarieties;
    }

    // Update incoming orders' quantityCurr values with new varieties
    if (processedVarieties && processedVarieties.length > 0) {
      const updatesByIncomingOrder = new Map<
        string,
        Array<{
          varietyName: string;
          bagSizeName: string;
          locationId: string;
          quantityRemoved: number;
        }>
      >();

      for (const variety of processedVarieties) {
        if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
          for (const bagSize of variety.bagSizes) {
            const incomingOrderId = bagSize.incomingOrderId;
            if (!updatesByIncomingOrder.has(incomingOrderId)) {
              updatesByIncomingOrder.set(incomingOrderId, []);
            }
            const updates = updatesByIncomingOrder.get(incomingOrderId);
            if (updates) {
              updates.push({
                varietyName: bagSize.varietyName,
                bagSizeName: bagSize.name,
                locationId: bagSize.locationId,
                quantityRemoved: bagSize.quantityRemoved,
              });
            }
          }
        }
      }

      // Update each incoming order
      for (const [incomingOrderId, updates] of updatesByIncomingOrder.entries()) {
        const incomingOrder = await this.fastify.prisma.incomingOrder.findUnique({
          where: { id: incomingOrderId },
        });

        if (!incomingOrder) {
          throw new OutgoingOrderValidationError(`Incoming order ${incomingOrderId} not found`);
        }

        const updatedVarieties = (incomingOrder.varieties as IncomingVariety[]).map(
          (variety: IncomingVariety) => {
            const varietyUpdates = updates.filter((update) => update.varietyName === variety.name);
            if (varietyUpdates.length === 0) {
              return variety;
            }

            const updatedBagSizes = (variety.bagSizes || []).map((bagSize) => {
              const bagSizeUpdate = varietyUpdates.find(
                (update) =>
                  update.bagSizeName === bagSize.name && update.locationId === bagSize.locationId
              );

              if (bagSizeUpdate) {
                return {
                  ...bagSize,
                  quantityCurr: Math.max(
                    0,
                    (bagSize.quantityCurr || 0) - bagSizeUpdate.quantityRemoved
                  ),
                };
              }
              return bagSize;
            });

            return {
              ...variety,
              bagSizes: updatedBagSizes,
            };
          }
        );

        await this.fastify.prisma.incomingOrder.update({
          where: { id: incomingOrderId },
          data: {
            varieties: updatedVarieties,
          },
        });
      }
    }

    // Calculate currentStockAtThatTime
    let finalCurrentStock = data.currentStockAtThatTime;

    if (quantitiesHaveChanged && processedVarieties && processedVarieties.length > 0) {
      // Get stock before this order
      const ordersBefore = await this.fastify.prisma.incomingOrder.findMany({
        where: {
          coldStorageId,
          commodity,
          createdAt: {
            lt: existingOrder.createdAt,
          },
        },
        select: {
          currentStockAtThatTime: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      const outgoingOrdersBefore = await this.fastify.prisma.outgoingOrder.findMany({
        where: {
          coldStorageId,
          commodity,
          createdAt: {
            lt: existingOrder.createdAt,
          },
        },
        select: {
          currentStockAtThatTime: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      let latestStockBefore = 0;
      if (ordersBefore.length > 0 && outgoingOrdersBefore.length > 0) {
        latestStockBefore =
          ordersBefore[0].createdAt > outgoingOrdersBefore[0].createdAt
            ? ordersBefore[0].currentStockAtThatTime || 0
            : outgoingOrdersBefore[0].currentStockAtThatTime || 0;
      } else if (ordersBefore.length > 0) {
        latestStockBefore = ordersBefore[0].currentStockAtThatTime || 0;
      } else if (outgoingOrdersBefore.length > 0) {
        latestStockBefore = outgoingOrdersBefore[0].currentStockAtThatTime || 0;
      }

      const quantityRemoved = calculateQuantityRemovedFromVarieties(
        processedVarieties as Array<{ bagSizes?: Array<{ quantityRemoved?: number }> }>
      );
      const calculatedCurrentStock = Math.max(0, latestStockBefore - quantityRemoved);

      finalCurrentStock =
        data.currentStockAtThatTime !== undefined
          ? data.currentStockAtThatTime
          : calculatedCurrentStock;
    } else if (
      (data.varieties === null || (Array.isArray(data.varieties) && data.varieties.length === 0)) &&
      (!processedVarieties || processedVarieties.length === 0)
    ) {
      // Converting to null voucher
      if (data.currentStockAtThatTime === undefined) {
        finalCurrentStock = await getLatestOrderCurrentStock(
          this.fastify,
          coldStorageId,
          commodity
        );
      }
    } else if (data.currentStockAtThatTime === undefined) {
      finalCurrentStock = existingOrder.currentStockAtThatTime ?? undefined;
    }

    // Calculate totalBags and totalWeight
    let totalBags = 0;
    let totalWeight = 0;

    if (processedVarieties && processedVarieties.length > 0) {
      for (const variety of processedVarieties) {
        if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
          for (const bagSize of variety.bagSizes) {
            totalBags += bagSize.quantityRemoved || 0;
            totalWeight += (bagSize.approxWeight || 0) * (bagSize.quantityRemoved || 0);
          }
        }
      }
    }

    // Update the order
    const updatedOrder = await this.fastify.prisma.outgoingOrder.update({
      where: { id },
      data: {
        ...(data.farmerStorageLinkId && { farmerStorageLinkId: data.farmerStorageLinkId }),
        ...(data.commodity !== undefined && { commodity: data.commodity }),
        ...(data.gatePassNumber !== undefined && { gatePassNumber: data.gatePassNumber }),
        ...(data.gatePassType !== undefined && { gatePassType: data.gatePassType }),
        ...(data.date !== undefined && { date: data.date || null }),
        ...(data.remarks !== undefined && { remarks: data.remarks || null }),
        ...(finalCurrentStock !== undefined && { currentStockAtThatTime: finalCurrentStock }),
        ...(data.varieties !== undefined && { varieties: processedVarieties }),
        ...(totalBags > 0 && { totalBags }),
        ...(totalBags === 0 && { totalBags: undefined }),
        ...(totalWeight > 0 && { totalWeight }),
        ...(totalWeight === 0 && { totalWeight: undefined }),
      },
      include: {
        farmerStorageLink: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                address: true,
                mobileNumber: true,
                imageUrl: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Recalculate stock for all subsequent orders if quantities changed
    if (quantitiesHaveChanged) {
      await recalculateStockAfterOrder(
        this.fastify,
        coldStorageId,
        commodity,
        existingOrder.createdAt,
        id,
        updatedOrder.currentStockAtThatTime ?? undefined
      );
    }

    const enrichedOrder = await this.enrichOrderWithLocations(updatedOrder);

    return this.mapToResponse(enrichedOrder);
  }

  /**
   * Get all outgoing orders for a cold storage
   */
  async getAll(
    coldStorageId: string,
    options?: {
      page?: number;
      limit?: number;
      commodity?: string;
      gatePassType?: string;
      search?: string;
    }
  ): Promise<OutgoingOrderListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OutgoingOrderWhereInput = {
      coldStorageId,
    };

    if (options?.commodity) {
      where.commodity = options.commodity as any;
    }

    if (options?.gatePassType) {
      where.gatePassType = options.gatePassType as any;
    }

    if (options?.search) {
      // Search by gate pass number
      where.gatePassNumber = {
        equals: parseInt(options.search, 10) || undefined,
      };
    }

    const [orders, count] = await Promise.all([
      this.fastify.prisma.outgoingOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          farmerStorageLink: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  mobileNumber: true,
                  imageUrl: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.fastify.prisma.outgoingOrder.count({ where }),
    ]);

    const enrichedOrders = await Promise.all(
      orders.map((order) => this.enrichOrderWithLocations(order))
    );

    return {
      data: enrichedOrders.map((order) => this.mapToResponse(order)),
      count,
    };
  }

  /**
   * Get all outgoing orders for a specific farmer
   */
  async getByFarmer(
    coldStorageId: string,
    farmerStorageLinkId: string,
    options?: {
      page?: number;
      limit?: number;
      commodity?: string;
    }
  ): Promise<OutgoingOrderListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Verify farmer storage link belongs to cold storage
    const link = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: { id: farmerStorageLinkId },
    });

    if (!link || link.coldStorageId !== coldStorageId) {
      throw new OutgoingOrderValidationError('Invalid farmer storage link');
    }

    // Build where clause
    const where: Prisma.OutgoingOrderWhereInput = {
      coldStorageId,
      farmerStorageLinkId,
    };

    if (options?.commodity) {
      where.commodity = options.commodity as any;
    }

    const [orders, count] = await Promise.all([
      this.fastify.prisma.outgoingOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          farmerStorageLink: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  mobileNumber: true,
                  imageUrl: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.fastify.prisma.outgoingOrder.count({ where }),
    ]);

    const enrichedOrders = await Promise.all(
      orders.map((order) => this.enrichOrderWithLocations(order))
    );

    return {
      data: enrichedOrders.map((order) => this.mapToResponse(order)),
      count,
    };
  }

  /**
   * Delete an outgoing order
   */
  async delete(id: string, coldStorageId: string): Promise<void> {
    // Get existing order
    const existingOrder = await this.fastify.prisma.outgoingOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new OutgoingOrderNotFoundError(id);
    }

    if (existingOrder.coldStorageId !== coldStorageId) {
      throw new OutgoingOrderValidationError('Order does not belong to this cold storage');
    }

    // Delete the order
    await this.fastify.prisma.outgoingOrder.delete({
      where: { id },
    });

    // Recalculate stock for all subsequent orders
    await recalculateStockAfterOrder(
      this.fastify,
      coldStorageId,
      existingOrder.commodity,
      existingOrder.createdAt
    );
  }

  /**
   * Enrich order varieties with location data (floor, row, chamber)
   */
  private async enrichOrderWithLocations(order: {
    id: string;
    farmerStorageLinkId: string;
    coldStorageId: string | null;
    commodity: string;
    gatePassType: string;
    gatePassNumber: number;
    date: Date | null;
    remarks: string | null;
    currentStockAtThatTime: number | null;
    varieties: Array<{
      name: string;
      bagSizes: Array<{
        name: string;
        locationId: string;
        incomingOrderId: string;
        varietyName: string;
        quantityBefore: number;
        quantityRemoved: number;
        quantityAfter: number;
        approxWeight: number | null;
        floor?: string;
        row?: string;
        chamber?: string;
      }>;
    }>;
    totalBags: number | null;
    totalWeight: number | null;
    createdById: string | null;
    approvedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    farmerStorageLink?: {
      id: string;
      farmer: {
        id: string;
        name: string;
        address: string;
        mobileNumber: string;
        imageUrl: string | null;
      };
    };
    createdBy?: {
      id: string;
      name: string;
    } | null;
  }) {
    const locationIds = (order.varieties || [])
      .flatMap((v) => (v.bagSizes || []).map((b) => b.locationId))
      .filter((id): id is string => Boolean(id));

    if (locationIds.length === 0) {
      return order;
    }

    const locations = await this.fastify.prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, floor: true, row: true, chamber: true },
    });

    const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

    const enrichedVarieties = (order.varieties || []).map((variety) => ({
      ...variety,
      bagSizes: (variety.bagSizes || []).map((bag) => {
        const loc = locationMap.get(bag.locationId);
        return {
          ...bag,
          ...(loc
            ? {
                floor: loc.floor,
                row: loc.row,
                chamber: loc.chamber,
              }
            : {}),
        };
      }),
    }));

    return { ...order, varieties: enrichedVarieties };
  }

  /**
   * Map Prisma model to response type
   */
  private mapToResponse(order: {
    id: string;
    farmerStorageLinkId: string;
    coldStorageId: string | null;
    commodity: string;
    gatePassType: string;
    gatePassNumber: number;
    date: Date | null;
    remarks: string | null;
    currentStockAtThatTime: number | null;
    varieties: Array<{
      name: string;
      bagSizes: Array<{
        name: string;
        locationId: string;
        incomingOrderId: string;
        varietyName: string;
        quantityBefore: number;
        quantityRemoved: number;
        quantityAfter: number;
        approxWeight: number | null;
      }>;
    }>;
    totalBags: number | null;
    totalWeight: number | null;
    createdById: string | null;
    approvedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    farmerStorageLink?: {
      id: string;
      farmer: {
        id: string;
        name: string;
        address: string;
        mobileNumber: string;
        imageUrl: string | null;
      };
    };
    createdBy?: {
      id: string;
      name: string;
    } | null;
  }): OutgoingOrderResponse {
    // Convert null approxWeight to undefined for type compatibility
    // Include floor, row, chamber if they exist (from enrichment)
    const processedVarieties: VarietySnapshotInput[] = (order.varieties || []).map((variety) => ({
      name: variety.name,
      bagSizes: variety.bagSizes.map((bagSize: any) => ({
        name: bagSize.name,
        locationId: bagSize.locationId,
        incomingOrderId: bagSize.incomingOrderId,
        varietyName: bagSize.varietyName,
        quantityBefore: bagSize.quantityBefore,
        quantityRemoved: bagSize.quantityRemoved,
        quantityAfter: bagSize.quantityAfter,
        approxWeight: bagSize.approxWeight ?? undefined,
        ...(bagSize.floor && { floor: bagSize.floor }),
        ...(bagSize.row && { row: bagSize.row }),
        ...(bagSize.chamber && { chamber: bagSize.chamber }),
      })),
    }));

    return {
      id: order.id,
      farmerStorageLinkId: order.farmerStorageLinkId,
      coldStorageId: order.coldStorageId,
      commodity: order.commodity,
      gatePassType: order.gatePassType as OutgoingOrderResponse['gatePassType'],
      gatePassNumber: order.gatePassNumber,
      date: order.date,
      remarks: order.remarks,
      currentStockAtThatTime: order.currentStockAtThatTime,
      varieties: processedVarieties,
      totalBags: order.totalBags,
      totalWeight: order.totalWeight,
      createdById: order.createdById,
      approvedById: order.approvedById,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      farmerStorageLink: order.farmerStorageLink
        ? {
            id: order.farmerStorageLink.id,
            farmer: {
              id: order.farmerStorageLink.farmer.id,
              name: order.farmerStorageLink.farmer.name,
              address: order.farmerStorageLink.farmer.address,
              mobileNumber: order.farmerStorageLink.farmer.mobileNumber,
              imageUrl: order.farmerStorageLink.farmer.imageUrl,
            },
          }
        : undefined,
      createdBy: order.createdBy
        ? {
            id: order.createdBy.id,
            name: order.createdBy.name,
          }
        : undefined,
    };
  }
}
