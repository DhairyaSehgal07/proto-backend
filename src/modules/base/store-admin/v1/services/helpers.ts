import type { FastifyInstance } from 'fastify';
import { Commodity } from '../../../../../../generated/prisma/client.js';

/**
 * Get the next gate pass number for a given cold storage and commodity
 * Queries either incoming or outgoing orders based on the type parameter
 * Returns the next available gate pass number (max + 1)
 * If no orders exist, returns 1
 */
export async function getNextGatePassNumber(
  fastify: FastifyInstance,
  coldStorageId: string,
  commodity: Commodity,
  type: 'incoming' | 'outgoing'
): Promise<number> {
  let maxGatePassNumber = 0;

  if (type === 'incoming') {
    // Query incoming orders for this cold storage and commodity
    const maxIncoming = await fastify.prisma.incomingOrder.findFirst({
      where: {
        coldStorageId,
        commodity,
      },
      orderBy: {
        gatePassNumber: 'desc',
      },
      select: {
        gatePassNumber: true,
      },
    });

    maxGatePassNumber = maxIncoming?.gatePassNumber ?? 0;
  } else {
    // Query outgoing orders for this cold storage and commodity
    const maxOutgoing = await fastify.prisma.outgoingOrder.findFirst({
      where: {
        coldStorageId,
        commodity,
      },
      orderBy: {
        gatePassNumber: 'desc',
      },
      select: {
        gatePassNumber: true,
      },
    });

    maxGatePassNumber = maxOutgoing?.gatePassNumber ?? 0;
  }

  // Return the next gate pass number (max + 1)
  // If no orders exist, maxGatePassNumber will be 0, so next will be 1
  return maxGatePassNumber + 1;
}
