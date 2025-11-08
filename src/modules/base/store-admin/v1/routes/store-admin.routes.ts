import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { StoreAdminController } from '../controllers/store-admin.controller.js';
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
  loginStoreAdminSchema,
  registerFarmerSchema,
  CreateStoreAdminInput,
  UpdateStoreAdminInput,
  StoreAdminIdParam,
  StoreAdminQuery,
  LoginStoreAdminInput,
  RegisterFarmerInput,
} from '../schemas/store-admin.schema.js';
import { authenticateAdmin } from '@/core/middleware/auth.middleware.js';
import { requirePermission } from '@/core/middleware/permission.middleware.js';
import {
  loginOptions,
  listOptions,
  getByIdOptions,
  createOptions,
  updateOptions,
  deleteOptions,
  registerFarmerOptions,
} from './options.js';
import {
  createBodyValidator,
  createLoginBodyValidator,
  createRegisterFarmerBodyValidator,
  validateParams,
  validateQuery,
} from './validators.js';

/**
 * Request/Response types for route handlers
 */
interface LoginStoreAdminRequestParams {
  Body: LoginStoreAdminInput;
}

interface ListStoreAdminRequestParams {
  Querystring: StoreAdminQuery;
}

interface GetStoreAdminRequestParams {
  Params: StoreAdminIdParam;
}

interface CreateStoreAdminRequestParams {
  Body: CreateStoreAdminInput;
}

interface UpdateStoreAdminRequestParams {
  Params: StoreAdminIdParam;
  Body: UpdateStoreAdminInput;
}

interface DeleteStoreAdminRequestParams {
  Params: StoreAdminIdParam;
}

interface RegisterFarmerRequestParams {
  Body: RegisterFarmerInput;
}

/**
 * Fastify route plugin for StoreAdmin API
 */
function storeAdminRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new StoreAdminController(fastify);

  /**
   * POST /api/v1/store-admin/login
   * Login store admin
   */
  fastify.post(
    '/login',
    {
      ...loginOptions,
      preHandler: [createLoginBodyValidator(loginStoreAdminSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.login(request as FastifyRequest<LoginStoreAdminRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/store-admin
   * Get all store admins
   */
  fastify.get(
    '/',
    {
      ...listOptions,
      preHandler: [validateQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAll(request as FastifyRequest<ListStoreAdminRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/store-admin/:id
   * Get a single store admin
   */
  fastify.get(
    '/:id',
    {
      ...getByIdOptions,
      preHandler: [validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getById(request as FastifyRequest<GetStoreAdminRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/store-admin
   * Create a new store admin
   */
  fastify.post(
    '/',
    {
      ...createOptions,
      preHandler: [createBodyValidator(createStoreAdminSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreateStoreAdminRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/store-admin/:id
   * Update an existing store admin
   */
  fastify.put(
    '/:id',
    {
      ...updateOptions,
      preHandler: [validateParams, createBodyValidator(updateStoreAdminSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.update(request as FastifyRequest<UpdateStoreAdminRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/store-admin/:id
   * Delete a store admin
   */
  fastify.delete(
    '/:id',
    {
      ...deleteOptions,
      preHandler: [validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeleteStoreAdminRequestParams>, reply);
    }
  );

  /* STORE ADMIN FUNCTIONALITY ROUTES */

  /**
   * POST /api/v1/store-admin/register-farmer
   * Register a farmer and link to cold storage
   */
  fastify.post(
    '/register-farmer',
    {
      ...registerFarmerOptions,
      preHandler: [
        authenticateAdmin,
        requirePermission('farmers', 'create'),
        createRegisterFarmerBodyValidator(registerFarmerSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.registerFarmer(
        request as FastifyRequest<RegisterFarmerRequestParams>,
        reply
      );
    }
  );
}

export default storeAdminRoutes;
