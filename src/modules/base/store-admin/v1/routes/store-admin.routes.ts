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
  DaybookQuery,
  GatePassNumberQuery,
  FarmerOrdersQuery,
  FarmerStorageLinkIdParam,
  ColdStorageAnalyticsQuery,
  VarietyInventoryAnalysisQuery,
} from '../schemas/store-admin.schema.js';
import { authenticateAdmin } from '@/core/middleware/auth.middleware.js';
import { requirePermission } from '@/core/middleware/permission.middleware.js';
import {
  loginOptions,
  logoutOptions,
  listOptions,
  getByIdOptions,
  createOptions,
  updateOptions,
  deleteOptions,
  registerFarmerOptions,
  daybookOptions,
  getFarmersOptions,
  getFarmerByIdOptions,
  getGatePassNumberOptions,
  getFarmerOrdersOptions,
  coldStorageAnalyticsOptions,
  varietyInventoryAnalysisOptions,
} from './options.js';
import {
  createBodyValidator,
  createLoginBodyValidator,
  createRegisterFarmerBodyValidator,
  validateParams,
  validateQuery,
  validateDaybookQuery,
  validateGatePassNumberQuery,
  validateFarmerOrdersQuery,
  validateFarmerStorageLinkIdParam,
  validateColdStorageAnalyticsQuery,
  validateVarietyInventoryAnalysisQuery,
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

interface DaybookRequestParams {
  Querystring: DaybookQuery;
}

interface GatePassNumberRequestParams {
  Querystring: GatePassNumberQuery;
}

interface FarmerOrdersRequestParams {
  Querystring: FarmerOrdersQuery;
}

interface GetFarmerByIdRequestParams {
  Params: FarmerStorageLinkIdParam;
}

interface ColdStorageAnalyticsRequestParams {
  Querystring: ColdStorageAnalyticsQuery;
}

interface VarietyInventoryAnalysisRequestParams {
  Querystring: VarietyInventoryAnalysisQuery;
}

/**
 * Fastify route plugin for StoreAdmin API
 */
function storeAdminRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new StoreAdminController(fastify);

  /**
   * POST /api/v1/store-admin/login
   * Login store admin with rate limiting (5 attempts per 15 minutes per IP)
   */
  fastify.post(
    '/login',
    {
      ...loginOptions,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
      preHandler: [createLoginBodyValidator(loginStoreAdminSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.login(request as FastifyRequest<LoginStoreAdminRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/store-admin/logout
   * Logout store admin
   */
  fastify.post(
    '/logout',
    {
      ...logoutOptions,
      preHandler: [authenticateAdmin],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.logout(request, reply);
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
    '/farmer/register',
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

  /**
   * GET /api/v1/store-admin/daybook
   * Get daybook orders (incoming and outgoing) with pagination, filtering, and sorting
   */
  fastify.get(
    '/daybook',
    {
      ...daybookOptions,
      preHandler: [authenticateAdmin, validateDaybookQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getDaybook(request as FastifyRequest<DaybookRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/store-admin/farmers
   * Get all farmers for the logged-in store admin's cold storage
   */
  fastify.get(
    '/farmers',
    {
      ...getFarmersOptions,
      preHandler: [authenticateAdmin],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getFarmers(request, reply);
    }
  );

  /**
   * GET /api/v1/store-admin/farmers/:id
   * Get farmer details by farmerStorageLinkId with populated farmer and linkedBy
   */
  fastify.get(
    '/farmers/:id',
    {
      ...getFarmerByIdOptions,
      preHandler: [authenticateAdmin, validateFarmerStorageLinkIdParam],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getFarmerById(request as FastifyRequest<GetFarmerByIdRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/store-admin/gate-pass-number
   * Get the next gate pass number for a commodity
   */
  fastify.get(
    '/gate-pass-number',
    {
      ...getGatePassNumberOptions,
      preHandler: [authenticateAdmin, validateGatePassNumberQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getNextGatePassNumber(
        request as FastifyRequest<GatePassNumberRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/store-admin/farmer-orders
   * Get all orders (incoming and outgoing) for a specific farmer
   */
  fastify.get(
    '/farmer/orders',
    {
      ...getFarmerOrdersOptions,
      preHandler: [authenticateAdmin, validateFarmerOrdersQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getFarmerOrders(request as FastifyRequest<FarmerOrdersRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/store-admin/analytics/overview
   * Get cold storage analytics overview
   */
  fastify.get(
    '/analytics/overview',
    {
      ...coldStorageAnalyticsOptions,
      preHandler: [authenticateAdmin, validateColdStorageAnalyticsQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getColdStorageAnalytics(
        request as FastifyRequest<ColdStorageAnalyticsRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/store-admin/inventory/variety-analysis
   * Get variety-wise inventory analysis for a given storage
   */
  fastify.get(
    '/inventory/variety-analysis',
    {
      ...varietyInventoryAnalysisOptions,
      preHandler: [authenticateAdmin, validateVarietyInventoryAnalysisQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getVarietyInventoryAnalysis(
        request as FastifyRequest<VarietyInventoryAnalysisRequestParams>,
        reply
      );
    }
  );
}

export default storeAdminRoutes;
