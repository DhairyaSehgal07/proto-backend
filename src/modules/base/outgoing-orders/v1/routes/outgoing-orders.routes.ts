import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { OutgoingOrderController } from '../controllers/outgoing-order.controller.js';
import { OutgoingOrderService } from '../services/outgoing-order.service.js';
import type {
  CreateOutgoingOrderInput,
  UpdateOutgoingOrderInput,
  OutgoingOrderIdParam,
  OutgoingOrderQuery,
  OutgoingOrderFarmerQuery,
} from '../schemas/outgoing-order-schema.js';
import { authenticateAdmin } from '@/core/middleware/auth.middleware.js';
import { requirePermission } from '@/core/middleware/permission.middleware.js';
import {
  createOptions,
  updateOptions,
  listOptions,
  getByFarmerOptions,
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
 * Fastify route plugin for OutgoingOrder API
 */
function outgoingOrderRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const service = new OutgoingOrderService(fastify);
  const controller = new OutgoingOrderController(service);

  /**
   * POST /api/v1/outgoing-orders
   * Create a new outgoing order
   */
  fastify.post(
    '/',
    {
      ...createOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('outgoing-orders', 'create'),
        createBodyValidator(),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreateOutgoingOrderRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/outgoing-orders
   * Get all outgoing orders for cold storage
   */
  fastify.get(
    '/',
    {
      ...listOptions,
      preHandler: [authenticateAdmin, requirePermission('outgoing-orders', 'read'), validateQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAll(request as FastifyRequest<ListOutgoingOrderRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/outgoing-orders/farmer
   * Get all outgoing orders for a specific farmer
   */
  fastify.get(
    '/farmer',
    {
      ...getByFarmerOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('outgoing-orders', 'read'),
        validateFarmerQuery,
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getByFarmer(request as FastifyRequest<GetFarmerOrdersRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/outgoing-orders/:id
   * Update an existing outgoing order
   */
  fastify.put(
    '/:id',
    {
      ...updateOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('outgoing-orders', 'update'),
        validateParams,
        updateBodyValidator(),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.update(request as FastifyRequest<UpdateOutgoingOrderRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/outgoing-orders/:id
   * Delete an outgoing order
   */
  fastify.delete(
    '/:id',
    {
      ...deleteOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('outgoing-orders', 'delete'),
        validateParams,
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeleteOutgoingOrderRequestParams>, reply);
    }
  );
}

export default outgoingOrderRoutes;
