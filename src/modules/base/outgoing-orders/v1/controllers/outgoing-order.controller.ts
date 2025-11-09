import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  OutgoingOrderService,
  OutgoingOrderNotFoundError,
  OutgoingOrderValidationError,
} from '../services/outgoing-order.service.js';
import type {
  CreateOutgoingOrderInput,
  UpdateOutgoingOrderInput,
  OutgoingOrderIdParam,
  OutgoingOrderQuery,
  OutgoingOrderFarmerQuery,
} from '../schemas/outgoing-order-schema.js';
import type {
  CreateOutgoingOrderRequest,
  UpdateOutgoingOrderRequest,
} from '../types/outgoing-order.js';

/**
 * Request/Response types for route handlers
 */
interface CreateOutgoingOrderRequestParams {
  Body: CreateOutgoingOrderInput;
}

interface UpdateOutgoingOrderRequestParams {
  Params: OutgoingOrderIdParam;
  Body: UpdateOutgoingOrderInput;
}

interface ListOutgoingOrderRequestParams {
  Querystring: OutgoingOrderQuery;
}

interface DeleteOutgoingOrderRequestParams {
  Params: OutgoingOrderIdParam;
}

interface GetFarmerOrdersRequestParams {
  Querystring: OutgoingOrderFarmerQuery;
}

/**
 * Controller for OutgoingOrder endpoints
 */
export class OutgoingOrderController {
  private readonly service: OutgoingOrderService;

  constructor(service: OutgoingOrderService) {
    this.service = service;
  }

  /**
   * POST /outgoing-orders - Create a new outgoing order
   */
  async create(
    request: FastifyRequest<CreateOutgoingOrderRequestParams>,
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
        request.body as CreateOutgoingOrderRequest,
        request.admin.id,
        request.admin.coldStorageId
      );

      reply.code(201).send({
        success: true,
        message: 'Outgoing order created successfully',
        data: { order },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * PUT /outgoing-orders/:id - Update an existing outgoing order
   */
  async update(
    request: FastifyRequest<UpdateOutgoingOrderRequestParams>,
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

      const { id } = request.params;
      const order = await this.service.update(
        id,
        request.body as UpdateOutgoingOrderRequest,
        request.admin.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: 'Outgoing order updated successfully',
        data: { order },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /outgoing-orders - Get all outgoing orders for cold storage
   */
  async getAll(
    request: FastifyRequest<ListOutgoingOrderRequestParams>,
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
   * GET /outgoing-orders/farmer - Get all outgoing orders for a specific farmer
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
   * DELETE /outgoing-orders/:id - Delete an outgoing order
   */
  async delete(
    request: FastifyRequest<DeleteOutgoingOrderRequestParams>,
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
        message: 'Outgoing order deleted successfully',
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

    if (error instanceof OutgoingOrderNotFoundError) {
      reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }

    if (error instanceof OutgoingOrderValidationError) {
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
