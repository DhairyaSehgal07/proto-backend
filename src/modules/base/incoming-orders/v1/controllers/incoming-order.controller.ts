import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  IncomingOrderService,
  IncomingOrderValidationError,
  IncomingOrderNotFoundError,
} from '../services/incoming-order.service.js';
import type {
  CreateIncomingOrderInput,
  UpdateIncomingOrderInput,
  IncomingOrderIdParam,
  IncomingOrderQuery,
  IncomingOrderFarmerQuery,
} from '../schemas/incoming-order-schema.js';
import type {
  CreateIncomingOrderRequest,
  UpdateIncomingOrderRequest,
} from '../types/incoming-order.js';

/**
 * Request/Response types for route handlers
 */
interface CreateIncomingOrderRequestParams {
  Body: CreateIncomingOrderInput;
}

interface UpdateIncomingOrderRequestParams {
  Params: IncomingOrderIdParam;
  Body: UpdateIncomingOrderInput;
}

interface GetIncomingOrderRequestParams {
  Params: IncomingOrderIdParam;
}

interface ListIncomingOrderRequestParams {
  Querystring: IncomingOrderQuery;
}

interface GetFarmerOrdersRequestParams {
  Querystring: IncomingOrderFarmerQuery;
}

interface DeleteIncomingOrderRequestParams {
  Params: IncomingOrderIdParam;
}

/**
 * Controller for IncomingOrder endpoints
 */
export class IncomingOrderController {
  private readonly service: IncomingOrderService;

  constructor(service: IncomingOrderService) {
    this.service = service;
  }

  /**
   * POST /incoming-orders - Create a new incoming order
   */
  async create(
    request: FastifyRequest<CreateIncomingOrderRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const order = await this.service.create(
        request.body as CreateIncomingOrderRequest,
        request.admin.id,
        request.admin.coldStorageId
      );

      reply.code(201).send({
        success: true,
        message: 'Incoming order created successfully',
        data: { order },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /incoming-orders - Get all incoming orders for cold storage
   */
  async getAll(
    request: FastifyRequest<ListIncomingOrderRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin?.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { page, limit, commodity, gatePassType, search } = request.query;

      const result = await this.service.getAll(request.admin.coldStorageId, {
        page,
        limit,
        commodity,
        gatePassType,
        search,
      });

      reply.code(200).send({
        success: true,
        data: result.data,
        meta: {
          total: result.count,
          page: page ?? 1,
          limit: limit ?? 10,
          totalPages: Math.ceil(result.count / (limit ?? 10)),
        },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /incoming-orders/farmer - Get all incoming orders for a specific farmer
   */
  async getByFarmer(
    request: FastifyRequest<GetFarmerOrdersRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin?.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { farmerStorageLinkId, page, limit, commodity } = request.query;

      const result = await this.service.getByFarmer(
        request.admin.coldStorageId,
        farmerStorageLinkId,
        {
          page,
          limit,
          commodity,
        }
      );

      console.log('result is: ', result);

      reply.code(200).send({
        success: true,
        data: result.data,
        meta: {
          total: result.count,
          page: page ?? 1,
          limit: limit ?? 10,
          totalPages: Math.ceil(result.count / (limit ?? 10)),
        },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /incoming-orders/:id - Get a single incoming order
   */
  async getById(
    request: FastifyRequest<GetIncomingOrderRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin?.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { id } = request.params;
      const order = await this.service.getById(id, request.admin.coldStorageId);

      console.log('order is: ', order);

      reply.code(200).send({
        success: true,
        data: order,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * PUT /incoming-orders/:id - Update an existing incoming order
   */
  async update(
    request: FastifyRequest<UpdateIncomingOrderRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin?.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { id } = request.params;
      const order = await this.service.update(
        id,
        request.body as UpdateIncomingOrderRequest,
        request.admin.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: 'Incoming order updated successfully',
        data: { order },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * DELETE /incoming-orders/:id - Delete an incoming order
   */
  async delete(
    request: FastifyRequest<DeleteIncomingOrderRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin?.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { id } = request.params;
      await this.service.delete(id, request.admin.coldStorageId);

      reply.code(200).send({
        success: true,
        message: 'Incoming order deleted successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Centralized error handler
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof Error) reply.log.error(error);

    if (error instanceof IncomingOrderNotFoundError) {
      reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }

    if (error instanceof IncomingOrderValidationError) {
      reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
      return;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string; meta?: any };
      if (prismaError.code === 'P2002') {
        // Prisma unique constraint violation
        const target = prismaError.meta?.target;
        if (Array.isArray(target) && target.includes('gatePassNumber')) {
          reply.code(409).send({
            success: false,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: 'Gate pass number already exists for this cold storage and commodity',
            },
          });
          return;
        }
        reply.code(409).send({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' },
        });
        return;
      }
    }

    reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error occurred',
      },
    });
  }
}
