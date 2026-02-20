import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PaymentHistoryDAO } from '../dao/payment-history.dao.js';
import type {
  CreatePaymentHistoryRequest,
  UpdatePaymentHistoryRequest,
  PaymentHistoryResponse,
  PaymentHistoryListResponse,
  PaymentHistoryWithRelations,
} from '../types/payment-history.js';
import type { JWTPayload } from '@/core/middleware/auth.middleware.js';
import { Prisma } from '../../../../../../generated/prisma/client.js';

/**
 * Custom error classes for business logic
 */
export class PaymentHistoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Payment history with id ${id} not found`);
    this.name = 'PaymentHistoryNotFoundError';
  }
}

export class PaymentHistoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentHistoryValidationError';
  }
}

/**
 * Service layer for PaymentHistory
 * Contains business logic and orchestrates DAO operations
 */
export class PaymentHistoryService {
  private readonly dao: PaymentHistoryDAO;
  private readonly fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.dao = new PaymentHistoryDAO(fastify);
  }

  /**
   * Get all payment histories with pagination and optional filters
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    farmerStorageLinkId?: string;
    type?: 'RENT' | 'PAYMENT' | 'EXPENSE';
    dateFrom?: Date;
    dateTo?: Date;
    coldStorageId?: string; // For filtering by cold storage
  }): Promise<PaymentHistoryListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause for filters
    const where: Prisma.FarmerPaymentHistoryWhereInput = {};

    if (options?.farmerStorageLinkId) {
      where.farmerStorageLinkId = options.farmerStorageLinkId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.dateFrom || options?.dateTo) {
      where.date = {};
      if (options.dateFrom) {
        where.date.gte = options.dateFrom;
      }
      if (options.dateTo) {
        const endOfDay = new Date(options.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.date.lte = endOfDay;
      }
    }

    // Filter by cold storage if provided
    if (options?.coldStorageId) {
      where.farmerStorageLink = {
        coldStorageId: options.coldStorageId,
      };
    }

    const [data, totalItems] = await Promise.all([
      this.dao.findAll({
        skip,
        take: limit,
        where,
        orderBy: { date: 'desc' },
      }),
      this.dao.count(where),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map((item) => this.mapToResponse(item)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * Get a payment history by ID
   */
  async getById(id: string): Promise<PaymentHistoryWithRelations> {
    const paymentHistory = await this.dao.findById(id);

    if (!paymentHistory) {
      throw new PaymentHistoryNotFoundError(id);
    }

    return this.mapToResponseWithRelations(paymentHistory);
  }

  /**
   * Create a new payment history
   * Ensures the paymentHistory relation in farmerStorageLink is properly maintained
   */
  async create(
    data: CreatePaymentHistoryRequest,
    request?: FastifyRequest
  ): Promise<PaymentHistoryResponse> {
    // Verify farmerStorageLink exists
    const linkExists = await this.dao.verifyFarmerStorageLinkExists(data.farmerStorageLinkId);
    if (!linkExists) {
      throw new PaymentHistoryValidationError(
        `Farmer storage link with id ${data.farmerStorageLinkId} not found`
      );
    }

    // Get the current user from JWT if available
    let createdBy: string | null = data.createdBy ?? null;
    if (request && !createdBy) {
      const user = request.user as JWTPayload | undefined;
      if (user?.adminId) {
        createdBy = user.adminId;
      }
    }

    const paymentHistory = await this.dao.create({
      ...data,
      createdBy,
    });

    // The relation is automatically maintained by Prisma when creating FarmerPaymentHistory
    // The paymentHistory array in FarmerStorageLink will be automatically updated via the relation

    return this.mapToResponse(paymentHistory);
  }

  /**
   * Update an existing payment history
   */
  async update(id: string, data: UpdatePaymentHistoryRequest): Promise<PaymentHistoryResponse> {
    // Verify payment history exists
    const existing = await this.dao.findById(id);
    if (!existing) {
      throw new PaymentHistoryNotFoundError(id);
    }

    const updated = await this.dao.update(id, data);
    return this.mapToResponse(updated);
  }

  /**
   * Delete a payment history
   */
  async delete(id: string): Promise<void> {
    // Verify payment history exists
    const existing = await this.dao.findById(id);
    if (!existing) {
      throw new PaymentHistoryNotFoundError(id);
    }

    await this.dao.delete(id);
    // The relation is automatically maintained by Prisma when deleting FarmerPaymentHistory
  }

  /**
   * Map database model to response type
   */
  private mapToResponse(paymentHistory: {
    id: string;
    farmerStorageLinkId: string;
    date: Date;
    amount: number;
    type: 'RENT' | 'PAYMENT' | 'EXPENSE';
    remarks: string;
    createdBy: string | null;
    voucherId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentHistoryResponse {
    return {
      id: paymentHistory.id,
      farmerStorageLinkId: paymentHistory.farmerStorageLinkId,
      date: paymentHistory.date,
      amount: paymentHistory.amount,
      type: paymentHistory.type,
      remarks: paymentHistory.remarks,
      createdBy: paymentHistory.createdBy,
      voucherId: paymentHistory.voucherId,
      createdAt: paymentHistory.createdAt,
      updatedAt: paymentHistory.updatedAt,
    };
  }

  /**
   * Map database model with relations to response type
   */
  private mapToResponseWithRelations(paymentHistory: {
    id: string;
    farmerStorageLinkId: string;
    date: Date;
    amount: number;
    type: 'RENT' | 'PAYMENT' | 'EXPENSE';
    remarks: string;
    createdBy: string | null;
    voucherId: string | null;
    createdAt: Date;
    updatedAt: Date;
    farmerStorageLink?: {
      id: string;
      accountNumber: number;
      farmer: {
        id: string;
        name: string;
        mobileNumber: string;
      };
    };
  }): PaymentHistoryWithRelations {
    return {
      ...this.mapToResponse(paymentHistory),
      farmerStorageLink: paymentHistory.farmerStorageLink
        ? {
            id: paymentHistory.farmerStorageLink.id,
            accountNumber: paymentHistory.farmerStorageLink.accountNumber,
            farmer: {
              id: paymentHistory.farmerStorageLink.farmer.id,
              name: paymentHistory.farmerStorageLink.farmer.name,
              mobileNumber: paymentHistory.farmerStorageLink.farmer.mobileNumber,
            },
          }
        : undefined,
    };
  }
}
