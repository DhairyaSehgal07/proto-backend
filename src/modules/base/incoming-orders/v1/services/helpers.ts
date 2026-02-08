import type { FastifyInstance } from 'fastify';

/**
 * Get the latest order's currentStockAtThatTime value for a given commodity
 * Checks both incoming and outgoing orders to find the most recent stock value
 *
 * @param fastify - Fastify instance to access prisma
 * @param coldStorageId - ID of the cold storage
 * @param commodity - Commodity name (free string, e.g. POTATO, FRUIT, OTHER)
 * @returns Latest current stock value, or 0 if no orders exist
 */
export const getLatestOrderCurrentStock = async (
  fastify: FastifyInstance,
  coldStorageId: string,
  commodity: string
): Promise<number> => {
  try {
    // Get the latest incoming order for this commodity
    const latestIncomingOrder = await fastify.prisma.incomingOrder.findFirst({
      where: {
        coldStorageId,
        commodity,
      },
      select: {
        currentStockAtThatTime: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get the latest outgoing order for this commodity
    const latestOutgoingOrder = await fastify.prisma.outgoingOrder.findFirst({
      where: {
        coldStorageId,
        commodity,
      },
      select: {
        currentStockAtThatTime: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Determine which is the latest
    if (!latestIncomingOrder && !latestOutgoingOrder) {
      return 0;
    }

    if (!latestIncomingOrder) {
      return latestOutgoingOrder?.currentStockAtThatTime || 0;
    }

    if (!latestOutgoingOrder) {
      return latestIncomingOrder?.currentStockAtThatTime || 0;
    }

    // Compare creation times to get the latest
    if (latestIncomingOrder.createdAt > latestOutgoingOrder.createdAt) {
      return latestIncomingOrder.currentStockAtThatTime || 0;
    }
    return latestOutgoingOrder.currentStockAtThatTime || 0;
  } catch (error) {
    fastify.log.error(error, 'Error in getLatestOrderCurrentStock');
    throw new Error('Failed to get latest order current stock.');
  }
};

/**
 * Helper function to calculate total quantity from incoming order varieties
 * Sums up quantityCurr from all bag sizes in all varieties
 *
 * @param varieties - Array of varieties with bagSizes (for incoming orders)
 * @returns Total quantity
 */
export const calculateQuantityFromVarieties = (
  varieties: Array<{ bagSizes?: Array<{ quantityCurr?: number }> }>
): number => {
  let totalQuantity = 0;

  for (const variety of varieties) {
    if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
      for (const bagSize of variety.bagSizes) {
        totalQuantity += bagSize.quantityCurr || 0;
      }
    }
  }

  return totalQuantity;
};

/**
 * Helper function to calculate total quantity removed from outgoing order varieties
 * Sums up quantityRemoved from all bag sizes in all varieties
 *
 * @param varieties - Array of varieties with bagSizes (for outgoing orders - VarietySnapshot[])
 * @returns Total quantity removed
 */
export const calculateQuantityRemovedFromVarieties = (
  varieties: Array<{ bagSizes?: Array<{ quantityRemoved?: number }> }>
): number => {
  let totalQuantityRemoved = 0;

  for (const variety of varieties) {
    if (variety.bagSizes && Array.isArray(variety.bagSizes)) {
      for (const bagSize of variety.bagSizes) {
        totalQuantityRemoved += bagSize.quantityRemoved || 0;
      }
    }
  }

  return totalQuantityRemoved;
};

/**
 * Check if quantities have changed between existing and new varieties
 * Compares the total quantityCurr from both arrays
 *
 * @param existingVarieties - Existing varieties array
 * @param newVarieties - New varieties array
 * @returns true if quantities changed, false otherwise
 */
export const quantitiesChanged = (
  existingVarieties: Array<{ bagSizes?: Array<{ quantityCurr?: number }> }>,
  newVarieties: Array<{ bagSizes?: Array<{ quantityCurr?: number }> }>
): boolean => {
  const existingQuantity = calculateQuantityFromVarieties(existingVarieties);
  const newQuantity = calculateQuantityFromVarieties(newVarieties);
  return existingQuantity !== newQuantity;
};

/**
 * Get stock value before a specific order (the previous order's stock)
 *
 * @param fastify - Fastify instance to access prisma
 * @param coldStorageId - ID of the cold storage
 * @param commodity - Commodity name (free string)
 * @param orderCreatedAt - Creation time of the order
 * @param excludeOrderId - Order ID to exclude
 * @returns Stock value before the specified order
 */
export const getStockBeforeOrder = async (
  fastify: FastifyInstance,
  coldStorageId: string,
  commodity: string,
  orderCreatedAt: Date,
  excludeOrderId?: string
): Promise<number> => {
  // Get the latest incoming order before this one
  const latestIncomingBefore = await fastify.prisma.incomingOrder.findFirst({
    where: {
      coldStorageId,
      commodity,
      createdAt: {
        lt: orderCreatedAt,
      },
      ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
    },
    select: {
      currentStockAtThatTime: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get the latest outgoing order before this one
  const latestOutgoingBefore = await fastify.prisma.outgoingOrder.findFirst({
    where: {
      coldStorageId,
      commodity,
      createdAt: {
        lt: orderCreatedAt,
      },
    },
    select: {
      currentStockAtThatTime: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Determine which is the latest before this order
  if (!latestIncomingBefore && !latestOutgoingBefore) {
    return 0;
  }

  if (!latestIncomingBefore) {
    return latestOutgoingBefore?.currentStockAtThatTime || 0;
  }

  if (!latestOutgoingBefore) {
    return latestIncomingBefore?.currentStockAtThatTime || 0;
  }

  // Compare creation times to get the latest before this order
  if (latestIncomingBefore.createdAt > latestOutgoingBefore.createdAt) {
    return latestIncomingBefore.currentStockAtThatTime || 0;
  }
  return latestOutgoingBefore.currentStockAtThatTime || 0;
};

/**
 * Recalculate stock for all orders after a given order
 * This is needed when updating or deleting an order to maintain stock consistency
 *
 * @param fastify - Fastify instance to access prisma
 * @param coldStorageId - ID of the cold storage
 * @param commodity - Commodity name (free string)
 * @param orderCreatedAt - Creation time of the order being updated/deleted
 * @param excludeOrderId - Order ID to exclude from recalculation (the one being updated/deleted)
 * @param baseStock - Optional base stock to start from (for updates, this should be the updated order's currentStockAtThatTime)
 */
export const recalculateStockAfterOrder = async (
  fastify: FastifyInstance,
  coldStorageId: string,
  commodity: string,
  orderCreatedAt: Date,
  excludeOrderId?: string,
  baseStock?: number
): Promise<void> => {
  try {
    // If baseStock is provided (for updates), use it; otherwise get stock before the order
    let runningStock: number;
    if (baseStock !== undefined) {
      // For updates: start from the updated order's currentStockAtThatTime
      runningStock = baseStock;
    } else {
      // For deletes: get stock before the order being deleted
      runningStock = await getStockBeforeOrder(
        fastify,
        coldStorageId,
        commodity,
        orderCreatedAt,
        excludeOrderId
      );
    }

    // Get all incoming orders after this one (same commodity)
    const subsequentIncomingOrders = await fastify.prisma.incomingOrder.findMany({
      where: {
        coldStorageId,
        commodity,
        createdAt: {
          gt: orderCreatedAt,
        },
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get all outgoing orders after this one (same commodity)
    const subsequentOutgoingOrders = await fastify.prisma.outgoingOrder.findMany({
      where: {
        coldStorageId,
        commodity,
        createdAt: {
          gt: orderCreatedAt,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Combine and sort all subsequent orders by createdAt
    const allSubsequentOrders = [
      ...subsequentIncomingOrders.map((o) => ({
        id: o.id,
        type: 'incoming' as const,
        createdAt: o.createdAt,
        varieties: o.varieties,
      })),
      ...subsequentOutgoingOrders.map((o) => ({
        id: o.id,
        type: 'outgoing' as const,
        createdAt: o.createdAt,
        varieties: o.varieties,
      })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Recalculate stock for each subsequent order in chronological order
    // Null vouchers (orders with null/empty varieties) don't change stock

    for (const order of allSubsequentOrders) {
      if (order.type === 'incoming') {
        const varieties = order.varieties as any[];

        // For null vouchers, stock remains the same
        if (!varieties || !Array.isArray(varieties) || varieties.length === 0) {
          // Null voucher: stock doesn't change, but update currentStockAtThatTime to match previous
          await fastify.prisma.incomingOrder.update({
            where: { id: order.id },
            data: { currentStockAtThatTime: runningStock },
          });
          // runningStock remains the same for next order
          continue;
        }

        // Calculate total quantity from this incoming order
        const orderQuantity = calculateQuantityFromVarieties(varieties);
        runningStock += orderQuantity;

        // Update the order's currentStockAtThatTime
        await fastify.prisma.incomingOrder.update({
          where: { id: order.id },
          data: { currentStockAtThatTime: runningStock },
        });
      } else {
        // Outgoing order
        const varieties = order.varieties as any[];

        // For null vouchers, stock remains the same
        if (!varieties || !Array.isArray(varieties) || varieties.length === 0) {
          // Null voucher: stock doesn't change, but update currentStockAtThatTime to match previous
          await fastify.prisma.outgoingOrder.update({
            where: { id: order.id },
            data: { currentStockAtThatTime: runningStock },
          });
          // runningStock remains the same for next order
          continue;
        }

        // Calculate total quantity removed from this outgoing order
        const quantityRemoved = calculateQuantityRemovedFromVarieties(varieties);
        runningStock = Math.max(0, runningStock - quantityRemoved);

        // Update the order's currentStockAtThatTime
        await fastify.prisma.outgoingOrder.update({
          where: { id: order.id },
          data: { currentStockAtThatTime: runningStock },
        });
      }
    }
  } catch (error) {
    fastify.log.error(error, 'Error in recalculateStockAfterOrder');
    throw new Error('Failed to recalculate stock after order.');
  }
};
