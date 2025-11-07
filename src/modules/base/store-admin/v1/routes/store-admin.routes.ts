import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { StoreAdminController } from '../controllers/store-admin.controller.js';
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
  storeAdminIdParamSchema,
  storeAdminQuerySchema,
  CreateStoreAdminInput,
  UpdateStoreAdminInput,
  StoreAdminIdParam,
  StoreAdminQuery,
} from '../schemas/store-admin.schema.js';

/**
 * Request/Response types for route handlers
 */
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

/**
 * Body validator factory (for create/update)
 */
function createBodyValidator(
  schema: typeof createStoreAdminSchema | typeof updateStoreAdminSchema
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      throw error;
    }
  };
}

/**
 * Params validator (/api/v1/store-admin/:id)
 */
function validateParams(request: FastifyRequest, reply: FastifyReply): void {
  try {
    const validated = storeAdminIdParamSchema.parse(request.params);
    request.params = validated;
  } catch (error) {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid route parameters',
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    throw error;
  }
}

/**
 * Query validator (for list/search)
 */
function validateQuery(request: FastifyRequest, reply: FastifyReply): void {
  try {
    const validated = storeAdminQuerySchema.parse(request.query);
    request.query = validated;
  } catch (error) {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    throw error;
  }
}

/**
 * Fastify route plugin for StoreAdmin API
 */
function storeAdminRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new StoreAdminController(fastify);

  /**
   * GET /api/v1/store-admin
   * Get all store admins
   */
  fastify.get(
    '/',
    {
      preHandler: [validateQuery],
      schema: {
        description: 'Get all store admins with pagination and search',
        tags: ['store-admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    personalAddress: { type: 'string', nullable: true },
                    mobileNumber: { type: 'string' },
                    role: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    coldStorageId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
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
      preHandler: [validateParams],
      schema: {
        description: 'Get a single store admin by ID',
        tags: ['store-admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  personalAddress: { type: 'string', nullable: true },
                  mobileNumber: { type: 'string' },
                  role: { type: 'string' },
                  isVerified: { type: 'boolean' },
                  coldStorageId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
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
      preHandler: [createBodyValidator(createStoreAdminSchema)],
      schema: {
        description: 'Create a new store admin',
        tags: ['store-admin'],
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  personalAddress: { type: 'string', nullable: true },
                  mobileNumber: { type: 'string' },
                  role: { type: 'string' },
                  isVerified: { type: 'boolean' },
                  coldStorageId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
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
      preHandler: [validateParams, createBodyValidator(updateStoreAdminSchema)],
      schema: {
        description: 'Update an existing store admin',
        tags: ['store-admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  personalAddress: { type: 'string', nullable: true },
                  mobileNumber: { type: 'string' },
                  role: { type: 'string' },
                  isVerified: { type: 'boolean' },
                  coldStorageId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
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
      preHandler: [validateParams],
      schema: {
        description: 'Delete a store admin by ID',
        tags: ['store-admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeleteStoreAdminRequestParams>, reply);
    }
  );
}

export default storeAdminRoutes;
