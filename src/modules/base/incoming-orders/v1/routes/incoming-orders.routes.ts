import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { IncomingOrderController } from '../controllers/incoming-order.controller.js';
import { IncomingOrderService } from '../services/incoming-order.service.js';
import type {
  CreateIncomingOrderInput,
  UpdateIncomingOrderInput,
  IncomingOrderIdParam,
  IncomingOrderQuery,
  IncomingOrderFarmerQuery,
} from '../schemas/incoming-order-schema.js';
import { authenticateAdmin } from '@/core/middleware/auth.middleware.js';
import { requirePermission } from '@/core/middleware/permission.middleware.js';
import {
  createOptions,
  listOptions,
  getByFarmerOptions,
  getByIdOptions,
  updateOptions,
  deleteOptions,
} from './options.js';
import {
  createBodyValidator,
  updateBodyValidator,
  validateParams,
  validateQuery,
  validateFarmerQuery,
} from './validators.js';

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
 * Fastify route plugin for IncomingOrder API
 */
function incomingOrderRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const service = new IncomingOrderService(fastify);
  const controller = new IncomingOrderController(service);

  /**
   * POST /api/v1/incoming-orders
   * Create a new incoming order
   */
  fastify.post(
    '/',
    {
      ...createOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('incoming-orders', 'create'),
        createBodyValidator(),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreateIncomingOrderRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/incoming-orders
   * Get all incoming orders for cold storage
   */
  fastify.get(
    '/',
    {
      ...listOptions,
      preHandler: [authenticateAdmin, requirePermission('incoming-orders', 'read'), validateQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAll(request as FastifyRequest<ListIncomingOrderRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/incoming-orders/farmer
   * Get all incoming orders for a specific farmer
   */
  fastify.get(
    '/farmer',
    {
      ...getByFarmerOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('incoming-orders', 'read'),
        validateFarmerQuery,
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getByFarmer(request as FastifyRequest<GetFarmerOrdersRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/incoming-orders/:id
   * Get a single incoming order
   */
  fastify.get(
    '/:id',
    {
      ...getByIdOptions,
      preHandler: [authenticateAdmin, requirePermission('incoming-orders', 'read'), validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getById(request as FastifyRequest<GetIncomingOrderRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/incoming-orders/:id
   * Update an existing incoming order
   */
  fastify.put(
    '/:id',
    {
      ...updateOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('incoming-orders', 'update'),
        validateParams,
        updateBodyValidator(),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.update(request as FastifyRequest<UpdateIncomingOrderRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/incoming-orders/:id
   * Delete an incoming order
   */
  fastify.delete(
    '/:id',
    {
      ...deleteOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('incoming-orders', 'delete'),
        validateParams,
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeleteIncomingOrderRequestParams>, reply);
    }
  );
}

export default incomingOrderRoutes;
