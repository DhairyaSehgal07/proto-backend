import type { FastifyInstance } from 'fastify';
import type {
  CreateIncomingOrderRequest,
  UpdateIncomingOrderRequest,
  IncomingOrderResponse,
  IncomingOrderListResponse,
  ProcessedVariety,
  ProcessedBagSize,
} from '../types/incoming-order.js';
import {
  getLatestOrderCurrentStock,
  calculateQuantityFromVarieties,
  recalculateStockAfterOrder,
  quantitiesChanged,
} from './helpers.js';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';

/**
 * Custom error classes for business logic
 */
export class IncomingOrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Incoming order with id ${id} not found`);
    this.name = 'IncomingOrderNotFoundError';
  }
}

export class IncomingOrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IncomingOrderValidationError';
  }
}

/**
 * Service layer for IncomingOrder
 * Contains business logic for creating incoming orders
 */
export class IncomingOrderService {
  private readonly fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Create a new incoming order
   */
  async create(
    data: CreateIncomingOrderRequest,
    adminId: string,
    coldStorageId: string
  ): Promise<IncomingOrderResponse> {
    // Validate required fields
    if (!data.farmerStorageLinkId || !data.commodity || data.gatePassNumber === undefined) {
      throw new IncomingOrderValidationError(
        'farmerStorageLinkId, commodity, and gatePassNumber are required'
      );
    }

    // If varieties are provided, validate their structure
    if (data.varieties !== undefined && data.varieties !== null) {
      if (!Array.isArray(data.varieties) || data.varieties.length === 0) {
        throw new IncomingOrderValidationError('varieties must be a non-empty array if provided');
      }

      // Validate each variety has bagSizes
      for (const variety of data.varieties) {
        if (!variety.name || !Array.isArray(variety.bagSizes) || variety.bagSizes.length === 0) {
          throw new IncomingOrderValidationError(
            'Each variety must have a name and non-empty bagSizes array'
          );
        }

        // Validate each bagSize has required fields
        for (const bagSize of variety.bagSizes) {
          if (
            !bagSize.name ||
            bagSize.quantityInit === undefined ||
            bagSize.quantityCurr === undefined ||
            !bagSize.floor ||
            !bagSize.row ||
            !bagSize.chamber
          ) {
            throw new IncomingOrderValidationError(
              'Each bagSize must have name, quantityInit, quantityCurr, floor, row, and chamber'
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
      throw new IncomingOrderValidationError('Invalid farmer storage link');
    }

    // Process varieties: lookup or create locations, then replace floor/row/chamber with locationId
    // For null vouchers, varieties will be empty array
    let processedVarieties: ProcessedVariety[] = [];

    if (data.varieties && Array.isArray(data.varieties) && data.varieties.length > 0) {
      processedVarieties = await Promise.all(
        data.varieties.map(async (variety) => {
          const processedBagSizes = await Promise.all(
            variety.bagSizes.map(async (bagSize) => {
              const { floor, row, chamber, ...restBagSize } = bagSize;

              // Find or create location using the composite unique constraint
              let location = await this.fastify.prisma.location.findFirst({
                where: {
                  coldStorageId,
                  floor,
                  row,
                  chamber,
                },
              });

              if (!location) {
                // Create new location if it doesn't exist
                // Handle race condition: if location is created by another request, find it again
                try {
                  location = await this.fastify.prisma.location.create({
                    data: {
                      coldStorageId,
                      floor,
                      row,
                      chamber,
                    },
                  });
                } catch (createError: any) {
                  // If unique constraint violation (location created by concurrent request), find it
                  if (createError?.code === 'P2002') {
                    location = await this.fastify.prisma.location.findFirst({
                      where: {
                        coldStorageId,
                        floor,
                        row,
                        chamber,
                      },
                    });
                  } else {
                    throw createError;
                  }
                }
              }

              if (!location) {
                throw new Error(
                  `Failed to find or create location for floor: ${floor}, row: ${row}, chamber: ${chamber}`
                );
              }

              // Return bagSize with locationId instead of floor/row/chamber
              return {
                ...restBagSize,
                locationId: location.id,
              } as ProcessedBagSize;
            })
          );

          return {
            name: variety.name,
            bagSizes: processedBagSizes,
          };
        })
      );
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

      // Calculate total quantity from the new incoming order
      const newOrderQuantity = calculateQuantityFromVarieties(processedVarieties);

      // For incoming order: add the new quantities to the latest stock
      const calculatedCurrentStock = latestStock + newOrderQuantity;

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

    // Create incoming order with processed varieties (now with locationId) or empty array for null vouchers
    const order = await this.fastify.prisma.incomingOrder.create({
      data: {
        farmerStorageLinkId: data.farmerStorageLinkId,
        coldStorageId,
        commodity: data.commodity,
        gatePassType: data.gatePassType || 'RECEIPT',
        gatePassNumber: data.gatePassNumber,
        remarks: data.remarks || null,
        currentStockAtThatTime: finalCurrentStock,
        varieties: processedVarieties || [], // empty array for null vouchers
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

    const enrichedOrder = await this.enrichOrderWithLocations(order as any);

    return this.mapToResponse(enrichedOrder as any);
  }

  /**
   * Get all incoming orders for a cold storage with pagination and filters
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
  ): Promise<IncomingOrderListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.IncomingOrderWhereInput = {
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
      this.fastify.prisma.incomingOrder.findMany({
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
      this.fastify.prisma.incomingOrder.count({ where }),
    ]);

    const enrichedOrders = await Promise.all(
      orders.map((order) => this.enrichOrderWithLocations(order as any))
    );

    return {
      data: enrichedOrders.map((order) => this.mapToResponse(order as any)),
      count,
    };
  }

  /**
   * Get all incoming orders for a specific farmer
   */
  async getByFarmer(
    coldStorageId: string,
    farmerStorageLinkId: string,
    options?: {
      page?: number;
      limit?: number;
      commodity?: string;
    }
  ): Promise<IncomingOrderListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Verify farmer storage link belongs to cold storage
    const link = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: { id: farmerStorageLinkId },
    });

    if (!link || link.coldStorageId !== coldStorageId) {
      throw new IncomingOrderValidationError('Invalid farmer storage link');
    }

    // Build where clause
    const where: Prisma.IncomingOrderWhereInput = {
      coldStorageId,
      farmerStorageLinkId,
    };

    if (options?.commodity) {
      where.commodity = options.commodity as any;
    }

    const [orders, count] = await Promise.all([
      this.fastify.prisma.incomingOrder.findMany({
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
      this.fastify.prisma.incomingOrder.count({ where }),
    ]);

    const enrichedOrders = await Promise.all(
      orders.map((order) => this.enrichOrderWithLocations(order as any))
    );

    return {
      data: enrichedOrders.map((order) => this.mapToResponse(order as any)),
      count,
    };
  }

  /**
   * Get a single incoming order by ID
   */
  async getById(id: string, coldStorageId: string): Promise<IncomingOrderResponse> {
    const order = await this.fastify.prisma.incomingOrder.findUnique({
      where: { id },
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
        coldStorage: {
          select: { id: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) throw new IncomingOrderNotFoundError(id);
    if (order.coldStorageId !== coldStorageId)
      throw new IncomingOrderValidationError('Order does not belong to this cold storage');

    const enrichedOrder = await this.enrichOrderWithLocations(order as any);

    return this.mapToResponse(enrichedOrder as any);
  }

  /**
   * Update an existing incoming order
   */
  async update(
    id: string,
    data: UpdateIncomingOrderRequest,
    coldStorageId: string
  ): Promise<IncomingOrderResponse> {
    // Get existing order
    const existingOrder = await this.fastify.prisma.incomingOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new IncomingOrderNotFoundError(id);
    }

    if (existingOrder.coldStorageId !== coldStorageId) {
      throw new IncomingOrderValidationError('Order does not belong to this cold storage');
    }

    // If farmerStorageLinkId is being updated, verify it belongs to cold storage
    if (data.farmerStorageLinkId) {
      const link = await this.fastify.prisma.farmerStorageLink.findUnique({
        where: { id: data.farmerStorageLinkId },
      });

      if (!link || link.coldStorageId !== coldStorageId) {
        throw new IncomingOrderValidationError('Invalid farmer storage link');
      }
    }

    // Process varieties if provided
    // Handle null vouchers: if varieties is explicitly null or empty array, use []; if undefined, keep existing
    let processedVarieties: ProcessedVariety[] | undefined;
    const commodity = data.commodity || existingOrder.commodity;

    if (data.varieties !== undefined) {
      if (
        data.varieties === null ||
        (Array.isArray(data.varieties) && data.varieties.length === 0)
      ) {
        // Explicitly setting to null voucher (empty array)
        processedVarieties = [];
      } else if (Array.isArray(data.varieties) && data.varieties.length > 0) {
        // Validate varieties structure
        for (const variety of data.varieties) {
          if (!variety.name || !Array.isArray(variety.bagSizes) || variety.bagSizes.length === 0) {
            throw new IncomingOrderValidationError(
              'Each variety must have a name and non-empty bagSizes array'
            );
          }

          for (const bagSize of variety.bagSizes) {
            if (
              !bagSize.name ||
              bagSize.quantityInit === undefined ||
              bagSize.quantityCurr === undefined ||
              !bagSize.floor ||
              !bagSize.row ||
              !bagSize.chamber
            ) {
              throw new IncomingOrderValidationError(
                'Each bagSize must have name, quantityInit, quantityCurr, floor, row, and chamber'
              );
            }
          }
        }

        // Process varieties: lookup or create locations
        processedVarieties = await Promise.all(
          data.varieties.map(async (variety) => {
            const processedBagSizes = await Promise.all(
              variety.bagSizes.map(async (bagSize) => {
                const { floor, row, chamber, ...restBagSize } = bagSize;

                let location = await this.fastify.prisma.location.findFirst({
                  where: {
                    coldStorageId,
                    floor,
                    row,
                    chamber,
                  },
                });

                if (!location) {
                  try {
                    location = await this.fastify.prisma.location.create({
                      data: {
                        coldStorageId,
                        floor,
                        row,
                        chamber,
                      },
                    });
                  } catch (createError: any) {
                    if (createError?.code === 'P2002') {
                      location = await this.fastify.prisma.location.findFirst({
                        where: {
                          coldStorageId,
                          floor,
                          row,
                          chamber,
                        },
                      });
                    } else {
                      throw createError;
                    }
                  }
                }

                if (!location) {
                  throw new Error(
                    `Failed to find or create location for floor: ${floor}, row: ${row}, chamber: ${chamber}`
                  );
                }

                return {
                  ...restBagSize,
                  locationId: location.id,
                } as ProcessedBagSize;
              })
            );

            return {
              name: variety.name,
              bagSizes: processedBagSizes,
            };
          })
        );
      }
    } else {
      // Varieties not provided in update, keep existing
      processedVarieties = (existingOrder.varieties as any) || [];
    }

    // Check if quantities changed
    // Handle null/undefined cases for null vouchers (empty arrays)
    const existingVarieties = (existingOrder.varieties as any) || [];
    const newVarieties = processedVarieties || [];
    const quantitiesHaveChanged = quantitiesChanged(existingVarieties, newVarieties);

    // Calculate new current stock if varieties changed
    let finalCurrentStock = data.currentStockAtThatTime;

    // For null vouchers (no varieties), don't change stock calculations
    if (
      quantitiesHaveChanged &&
      data.varieties !== undefined &&
      processedVarieties &&
      processedVarieties.length > 0
    ) {
      // Get the latest order's currentStockAtThatTime (before this order was created)
      // We need to get the order created just before this one for the same commodity
      const ordersBefore = await this.fastify.prisma.incomingOrder.findMany({
        where: {
          coldStorageId,
          commodity: commodity as any,
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
          commodity: commodity as any,
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

      // Find the latest order before this one
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

      // Calculate total quantity from the updated incoming order
      const newOrderQuantity = calculateQuantityFromVarieties(processedVarieties);
      // For incoming order: add the new quantities to the latest stock before this order
      const calculatedCurrentStock = latestStockBefore + newOrderQuantity;

      finalCurrentStock =
        data.currentStockAtThatTime !== undefined
          ? data.currentStockAtThatTime
          : calculatedCurrentStock;
    } else if (
      (data.varieties === null || (Array.isArray(data.varieties) && data.varieties.length === 0)) &&
      (!processedVarieties || processedVarieties.length === 0)
    ) {
      // Converting to null voucher: keep latest stock (don't change stock)
      if (data.currentStockAtThatTime === undefined) {
        finalCurrentStock = await getLatestOrderCurrentStock(
          this.fastify,
          coldStorageId,
          commodity
        );
      }
    } else if (data.currentStockAtThatTime === undefined) {
      // Keep existing stock if quantities didn't change and no new value provided
      finalCurrentStock = existingOrder.currentStockAtThatTime ?? undefined;
    }

    // Update the order
    const updatedOrder = await this.fastify.prisma.incomingOrder.update({
      where: { id },
      data: {
        ...(data.farmerStorageLinkId && { farmerStorageLinkId: data.farmerStorageLinkId }),
        ...(data.commodity !== undefined && { commodity: data.commodity }),
        ...(data.gatePassNumber !== undefined && { gatePassNumber: data.gatePassNumber }),
        ...(data.gatePassType !== undefined && { gatePassType: data.gatePassType }),
        ...(data.remarks !== undefined && { remarks: data.remarks || null }),
        ...(finalCurrentStock !== undefined && { currentStockAtThatTime: finalCurrentStock }),
        ...(data.varieties !== undefined && { varieties: processedVarieties }), // Can be empty array for null vouchers
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

    // If quantities changed, recalculate stock for all subsequent orders of the same commodity
    // Start from the updated order's currentStockAtThatTime
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

    const enrichedOrder = await this.enrichOrderWithLocations(updatedOrder as any);

    return this.mapToResponse(enrichedOrder as any);
  }

  /**
   * Delete an incoming order
   */
  async delete(id: string, coldStorageId: string): Promise<void> {
    // Get existing order
    const existingOrder = await this.fastify.prisma.incomingOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new IncomingOrderNotFoundError(id);
    }

    if (existingOrder.coldStorageId !== coldStorageId) {
      throw new IncomingOrderValidationError('Order does not belong to this cold storage');
    }

    // Delete the order
    await this.fastify.prisma.incomingOrder.delete({
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
  private async enrichOrderWithLocations(
    order: PrismaTypes.IncomingOrderGetPayload<{
      include: {
        farmerStorageLink: {
          include: {
            farmer: {
              select: {
                id: true;
                name: true;
                address: true;
                mobileNumber: true;
                imageUrl: true;
              };
            };
          };
        };
        createdBy?: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    }>
  ) {
    const locationIds = (order.varieties as any[])
      .flatMap((v) => (v.bagSizes || []).map((b: any) => b.locationId))
      .filter((id): id is string => Boolean(id));

    if (locationIds.length === 0) {
      return order;
    }

    const locations = await this.fastify.prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, floor: true, row: true, chamber: true },
    });

    const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

    const enrichedVarieties = (order.varieties as any[]).map((variety) => ({
      ...variety,
      bagSizes: (variety.bagSizes || []).map((bag: any) => {
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

    return { ...order, varieties: enrichedVarieties } as typeof order;
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(
    order: PrismaTypes.IncomingOrderGetPayload<{
      include: {
        farmerStorageLink: {
          include: {
            farmer: {
              select: {
                id: true;
                name: true;
                address: true;
                mobileNumber: true;
                imageUrl: true;
              };
            };
          };
        };
        createdBy?: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    }>
  ): IncomingOrderResponse {
    return {
      id: order.id,
      farmerStorageLinkId: order.farmerStorageLinkId,
      coldStorageId: order.coldStorageId,
      commodity: order.commodity,
      gatePassType: order.gatePassType,
      gatePassNumber: order.gatePassNumber,
      remarks: order.remarks,
      currentStockAtThatTime: order.currentStockAtThatTime,
      varieties: order.varieties as ProcessedVariety[],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdById: order.createdById,
      farmerStorageLink: order.farmerStorageLink
        ? {
            id: order.farmerStorageLink.id,
            accountNumber: order.farmerStorageLink.accountNumber,
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
