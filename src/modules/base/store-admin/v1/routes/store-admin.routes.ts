import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { StoreAdminController } from '../controllers/store-admin.controller.js';
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
  loginStoreAdminSchema,
  registerFarmerSchema,
  refreshTokenSchema,
  CreateStoreAdminInput,
  UpdateStoreAdminInput,
  StoreAdminIdParam,
  StoreAdminQuery,
  LoginStoreAdminInput,
  RefreshTokenInput,
  RegisterFarmerInput,
  DaybookQuery,
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
} from './options.js';
import {
  createBodyValidator,
  createLoginBodyValidator,
  createRegisterFarmerBodyValidator,
  validateParams,
  validateQuery,
  validateDaybookQuery,
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
      preHandler: [createLoginBodyValidator(loginStoreAdminSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Rate limiting: 5 attempts per 15 minutes per IP
      const rateLimitKey =
        request.ip ||
        request.socket.remoteAddress ||
        request.headers['x-forwarded-for']?.toString().split(',')[0] ||
        'unknown';

      // Simple in-memory rate limiting (for production, use Redis or similar)
      type RateLimitStore = Map<string, { count: number; resetTime: number }>;
      const rateLimitStore: RateLimitStore =
        (fastify as FastifyInstance & { rateLimitStore?: RateLimitStore }).rateLimitStore ||
        new Map();
      (fastify as FastifyInstance & { rateLimitStore: RateLimitStore }).rateLimitStore =
        rateLimitStore;

      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxAttempts = 15;

      const userAttempts = rateLimitStore.get(rateLimitKey) || {
        count: 0,
        resetTime: now + windowMs,
      };

      if (now > userAttempts.resetTime) {
        userAttempts.count = 0;
        userAttempts.resetTime = now + windowMs;
      }

      if (userAttempts.count >= maxAttempts) {
        const retryAfter = Math.ceil((userAttempts.resetTime - now) / 1000);
        reply.code(429).send({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
            retryAfter,
          },
        });
        return;
      }

      userAttempts.count++;
      rateLimitStore.set(rateLimitKey, userAttempts);

      await controller.login(request as FastifyRequest<LoginStoreAdminRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/store-admin/refresh
   * Refresh access token
   */
  fastify.post(
    '/refresh',
    {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['store-admin'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              minLength: 1,
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
          try {
            const validated = refreshTokenSchema.parse(request.body);
            request.body = validated;
          } catch (error) {
            if (error instanceof ZodError) {
              reply.code(400).send({
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Request validation failed',
                  details: error.issues.map((e) => ({
                    path: e.path.map(String).join('.'),
                    message: e.message,
                  })),
                },
              });
              return;
            }
            throw error;
          }
        },
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.refreshToken(request as FastifyRequest<{ Body: RefreshTokenInput }>, reply);
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
}

export default storeAdminRoutes;
