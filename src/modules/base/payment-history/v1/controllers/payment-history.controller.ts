import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  PaymentHistoryService,
  PaymentHistoryNotFoundError,
  PaymentHistoryValidationError,
} from '../services/payment-history.service.js';

import type {
  PaymentHistoryIdParam,
  PaymentHistoryQuery,
  CreatePaymentHistoryInput,
  UpdatePaymentHistoryInput,
} from '../schemas/payment-history.schema.js';

// Route-level types
interface CreatePaymentHistoryRequestParams {
  Body: CreatePaymentHistoryInput;
}

interface UpdatePaymentHistoryRequestParams {
  Params: PaymentHistoryIdParam;
  Body: UpdatePaymentHistoryInput;
}

interface GetPaymentHistoryRequestParams {
  Params: PaymentHistoryIdParam;
}

interface DeletePaymentHistoryRequestParams {
  Params: PaymentHistoryIdParam;
}

interface ListPaymentHistoryRequestParams {
  Querystring: PaymentHistoryQuery;
}

/**
 * Controller for PaymentHistory endpoints
 */
export class PaymentHistoryController {
  private readonly service: PaymentHistoryService;

  constructor(fastify: FastifyInstance) {
    this.service = new PaymentHistoryService(fastify);
  }

  /**
   * GET /payment-history - Get all payment histories
   */
  async getAll(
    request: FastifyRequest<ListPaymentHistoryRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const query = request.query;
      const user = request.user as { coldStorageId?: string } | undefined;

      const result = await this.service.getAll({
        page: query.page,
        limit: query.limit,
        farmerStorageLinkId: query.farmerStorageLinkId,
        type: query.type,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        coldStorageId: user?.coldStorageId, // Filter by logged-in user's cold storage
      });

      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /payment-history/:id - Get a single payment history
   */
  async getById(
    request: FastifyRequest<GetPaymentHistoryRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const paymentHistory = await this.service.getById(id);

      reply.code(200).send({
        success: true,
        data: paymentHistory,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * POST /payment-history - Create a new payment history
   */
  async create(
    request: FastifyRequest<CreatePaymentHistoryRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const body = request.body;
      const paymentHistory = await this.service.create(
        {
          farmerStorageLinkId: body.farmerStorageLinkId,
          date: body.date,
          amount: body.amount,
          type: body.type,
          remarks: body.remarks ?? '',
          createdBy: body.createdBy,
          voucherId: body.voucherId,
        },
        request
      );

      reply.code(201).send({
        success: true,
        message: 'Payment history created successfully',
        data: paymentHistory,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * PUT /payment-history/:id - Update an existing payment history
   */
  async update(
    request: FastifyRequest<UpdatePaymentHistoryRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const body = request.body;

      const paymentHistory = await this.service.update(id, {
        date: body.date,
        amount: body.amount,
        type: body.type,
        remarks: body.remarks,
        voucherId: body.voucherId,
      });

      reply.code(200).send({
        success: true,
        message: 'Payment history updated successfully',
        data: paymentHistory,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * DELETE /payment-history/:id - Delete a payment history
   */
  async delete(
    request: FastifyRequest<DeletePaymentHistoryRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      await this.service.delete(id);

      reply.code(200).send({
        success: true,
        message: 'Payment history deleted successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Error handler for controller methods
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof PaymentHistoryNotFoundError) {
      reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof PaymentHistoryValidationError) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
      return;
    }

    // Re-throw unexpected errors to be handled by global error handler
    throw error;
  }
}
