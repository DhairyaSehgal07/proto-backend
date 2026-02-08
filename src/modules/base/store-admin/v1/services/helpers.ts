import type { FastifyInstance } from 'fastify';

/**
 * Get the next gate pass number for a given cold storage and commodity.
 * Uses the same commodity string that will be stored on the order (no normalization).
 * Returns the latest (max) gate pass number + 1 so the next entry never duplicates.
 * If no orders exist, returns 1.
 */
export async function getNextGatePassNumber(
  fastify: FastifyInstance,
  coldStorageId: string,
  commodity: string,
  type: 'incoming' | 'outgoing'
): Promise<number> {
  const where = { coldStorageId, commodity };

  if (type === 'incoming') {
    const result = await fastify.prisma.incomingOrder.aggregate({
      where,
      _max: { gatePassNumber: true },
    });
    const maxGatePassNumber = result._max?.gatePassNumber ?? 0;
    return maxGatePassNumber + 1;
  }

  const result = await fastify.prisma.outgoingOrder.aggregate({
    where,
    _max: { gatePassNumber: true },
  });
  const maxGatePassNumber = result._max?.gatePassNumber ?? 0;
  return maxGatePassNumber + 1;
}
