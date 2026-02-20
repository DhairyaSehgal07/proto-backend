import type { FastifyInstance } from 'fastify';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';
import type {
  CreatePaymentHistoryRequest,
  UpdatePaymentHistoryRequest,
} from '../types/payment-history.js';

/**
 * Type for PaymentHistory with farmerStorageLink relation included
 */
type PaymentHistoryWithRelations = PrismaTypes.FarmerPaymentHistoryGetPayload<{
  include: {
    farmerStorageLink: {
      include: {
        farmer: {
          select: {
            id: true;
            name: true;
            mobileNumber: true;
          };
        };
      };
    };
  };
}>;

/**
 * Data Access Object for FarmerPaymentHistory
 * Handles all database operations
 */
export class PaymentHistoryDAO {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Get all payment histories with optional pagination and filtering
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: Prisma.FarmerPaymentHistoryWhereInput;
    orderBy?:
      | Prisma.FarmerPaymentHistoryOrderByWithRelationInput
      | Prisma.FarmerPaymentHistoryOrderByWithRelationInput[];
  }): Promise<PaymentHistoryWithRelations[]> {
    try {
      return await this.fastify.prisma.farmerPaymentHistory.findMany({
        skip: options?.skip,
        take: options?.take,
        where: options?.where,
        orderBy: options?.orderBy || { date: 'desc' },
        include: {
          farmerStorageLink: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  mobileNumber: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findAll payment histories');
      throw error;
    }
  }

  /**
   * Get total count of payment histories matching the filter
   */
  async count(where?: Prisma.FarmerPaymentHistoryWhereInput): Promise<number> {
    try {
      return await this.fastify.prisma.farmerPaymentHistory.count({ where });
    } catch (error) {
      this.fastify.log.error(error, 'Error in count payment histories');
      throw error;
    }
  }

  /**
   * Get a payment history by ID
   */
  async findById(id: string): Promise<PaymentHistoryWithRelations | null> {
    try {
      return await this.fastify.prisma.farmerPaymentHistory.findUnique({
        where: { id },
        include: {
          farmerStorageLink: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  mobileNumber: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in findById payment history: ${id}`);
      throw error;
    }
  }

  /**
   * Create a new payment history
   * Note: The relation to farmerStorageLink is automatically maintained by Prisma
   */
  async create(data: CreatePaymentHistoryRequest): Promise<PaymentHistoryWithRelations> {
    try {
      return await this.fastify.prisma.farmerPaymentHistory.create({
        data: {
          farmerStorageLinkId: data.farmerStorageLinkId,
          date: data.date,
          amount: data.amount,
          type: data.type,
          remarks: data.remarks ?? '',
          createdBy: data.createdBy ?? null,
          voucherId: data.voucherId ?? null,
        },
        include: {
          farmerStorageLink: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  mobileNumber: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in create payment history');
      throw error;
    }
  }

  /**
   * Update an existing payment history
   */
  async update(
    id: string,
    data: UpdatePaymentHistoryRequest
  ): Promise<PaymentHistoryWithRelations> {
    try {
      return await this.fastify.prisma.farmerPaymentHistory.update({
        where: { id },
        data: {
          ...(data.date !== undefined && { date: data.date }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.remarks !== undefined && { remarks: data.remarks }),
          ...(data.voucherId !== undefined && { voucherId: data.voucherId }),
        },
        include: {
          farmerStorageLink: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  mobileNumber: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in update payment history: ${id}`);
      throw error;
    }
  }

  /**
   * Delete a payment history
   */
  async delete(id: string): Promise<void> {
    try {
      await this.fastify.prisma.farmerPaymentHistory.delete({
        where: { id },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in delete payment history: ${id}`);
      throw error;
    }
  }

  /**
   * Verify that farmerStorageLink exists
   */
  async verifyFarmerStorageLinkExists(farmerStorageLinkId: string): Promise<boolean> {
    try {
      const link = await this.fastify.prisma.farmerStorageLink.findUnique({
        where: { id: farmerStorageLinkId },
      });
      return link !== null;
    } catch (error) {
      this.fastify.log.error(
        error,
        `Error in verifyFarmerStorageLinkExists: ${farmerStorageLinkId}`
      );
      throw error;
    }
  }
}
