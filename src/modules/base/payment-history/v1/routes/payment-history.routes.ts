import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentHistoryController } from '../controllers/payment-history.controller.js';
import {
  createPaymentHistorySchema,
  updatePaymentHistorySchema,
  CreatePaymentHistoryInput,
  UpdatePaymentHistoryInput,
  PaymentHistoryIdParam,
  PaymentHistoryQuery,
} from '../schemas/payment-history.schema.js';
import { authenticateAdmin } from '@/core/middleware/auth.middleware.js';
import { requirePermission } from '@/core/middleware/permission.middleware.js';
import {
  listOptions,
  getByIdOptions,
  createOptions,
  updateOptions,
  deleteOptions,
} from './options.js';
import {
  createBodyValidator,
  updateBodyValidator,
  validateParams,
  validateQuery,
} from './validators.js';

/**
 * Request/Response types for route handlers
 */
interface ListPaymentHistoryRequestParams {
  Querystring: PaymentHistoryQuery;
}

interface GetPaymentHistoryRequestParams {
  Params: PaymentHistoryIdParam;
}

interface CreatePaymentHistoryRequestParams {
  Body: CreatePaymentHistoryInput;
}

interface UpdatePaymentHistoryRequestParams {
  Params: PaymentHistoryIdParam;
  Body: UpdatePaymentHistoryInput;
}

interface DeletePaymentHistoryRequestParams {
  Params: PaymentHistoryIdParam;
}

/**
 * Fastify route plugin for PaymentHistory API
 */
function paymentHistoryRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new PaymentHistoryController(fastify);

  /**
   * GET /api/v1/payment-history
   * Get all payment histories
   */
  fastify.get(
    '/',
    {
      ...listOptions,
      preHandler: [authenticateAdmin, requirePermission('payment-history', 'read'), validateQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAll(request as FastifyRequest<ListPaymentHistoryRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/payment-history/:id
   * Get a single payment history
   */
  fastify.get(
    '/:id',
    {
      ...getByIdOptions,
      preHandler: [authenticateAdmin, requirePermission('payment-history', 'read'), validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getById(request as FastifyRequest<GetPaymentHistoryRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/payment-history
   * Create a new payment history
   */
  fastify.post(
    '/',
    {
      ...createOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('payment-history', 'create'),
        createBodyValidator(createPaymentHistorySchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreatePaymentHistoryRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/payment-history/:id
   * Update an existing payment history
   */
  fastify.put(
    '/:id',
    {
      ...updateOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('payment-history', 'update'),
        validateParams,
        updateBodyValidator(updatePaymentHistorySchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.update(request as FastifyRequest<UpdatePaymentHistoryRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/payment-history/:id
   * Delete a payment history
   */
  fastify.delete(
    '/:id',
    {
      ...deleteOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('payment-history', 'delete'),
        validateParams,
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeletePaymentHistoryRequestParams>, reply);
    }
  );
}

export default paymentHistoryRoutes;
