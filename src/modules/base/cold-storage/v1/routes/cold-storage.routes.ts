import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { ColdStorageController } from '../controllers/cold-storage.controller.js';
import {
  createColdStorageSchema,
  updateColdStorageSchema,
  coldStorageIdParamSchema,
  coldStorageQuerySchema,
  CreateColdStorageInput,
  UpdateColdStorageInput,
  ColdStorageIdParam,
  ColdStorageQuery,
} from '../schemas/cold-storage-schema.js';

/**
 * Request/Response types for route handlers
 */
interface ListColdStorageRequestParams {
  Querystring: ColdStorageQuery;
}

interface GetColdStorageRequestParams {
  Params: ColdStorageIdParam;
}

interface CreateColdStorageRequestParams {
  Body: CreateColdStorageInput;
}

interface UpdateColdStorageRequestParams {
  Params: ColdStorageIdParam;
  Body: UpdateColdStorageInput;
}

interface DeleteColdStorageRequestParams {
  Params: ColdStorageIdParam;
}

/**
 * Pre-handler factory to validate request body with Zod
 */
function createBodyValidator(
  schema: typeof createColdStorageSchema | typeof updateColdStorageSchema
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
 * Pre-handler to validate route parameters with Zod
 */
function validateParams(request: FastifyRequest, reply: FastifyReply): void {
  try {
    const validated = coldStorageIdParamSchema.parse(request.params);
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
 * Pre-handler to validate query parameters with Zod
 */
function validateQuery(request: FastifyRequest, reply: FastifyReply): void {
  try {
    const validated = coldStorageQuerySchema.parse(request.query);
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
 * Fastify route plugin for Cold Storage API
 * Registers all CRUD routes with validation
 */
function coldStorageRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new ColdStorageController(fastify);

  /**
   * GET /api/v1/cold-storage
   * Get all cold storages with pagination and search
   */
  fastify.get(
    '/',
    {
      preHandler: [validateQuery],
      schema: {
        description: 'Get all cold storages with pagination and optional search',
        tags: ['cold-storage'],
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
                    address: { type: 'string' },
                    mobileNumber: { type: 'string' },
                    capacity: { type: 'number' },
                    imageUrl: { type: 'string', nullable: true },
                    isPaid: { type: 'boolean' },
                    isActive: { type: 'boolean' },
                    plan: { type: 'string' },
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
      await controller.getAll(request as FastifyRequest<ListColdStorageRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/cold-storage/:id
   * Get a single cold storage by ID
   */
  fastify.get(
    '/:id',
    {
      preHandler: [validateParams],
      schema: {
        description: 'Get a single cold storage by ID',
        tags: ['cold-storage'],
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
                  address: { type: 'string' },
                  mobileNumber: { type: 'string' },
                  capacity: { type: 'number' },
                  imageUrl: { type: 'string', nullable: true },
                  isPaid: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  plan: { type: 'string' },
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
      await controller.getById(request as FastifyRequest<GetColdStorageRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/cold-storage
   * Create a new cold storage
   */
  fastify.post(
    '/',
    {
      preHandler: [createBodyValidator(createColdStorageSchema)],
      schema: {
        description: 'Create a new cold storage',
        tags: ['cold-storage'],
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  address: { type: 'string' },
                  mobileNumber: { type: 'string' },
                  capacity: { type: 'number' },
                  imageUrl: { type: 'string', nullable: true },
                  isPaid: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  plan: { type: 'string' },
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
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreateColdStorageRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/cold-storage/:id
   * Update an existing cold storage
   */
  fastify.put(
    '/:id',
    {
      preHandler: [validateParams, createBodyValidator(updateColdStorageSchema)],
      schema: {
        description: 'Update an existing cold storage',
        tags: ['cold-storage'],
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
                  address: { type: 'string' },
                  mobileNumber: { type: 'string' },
                  capacity: { type: 'number' },
                  imageUrl: { type: 'string', nullable: true },
                  isPaid: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  plan: { type: 'string' },
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
      await controller.update(request as FastifyRequest<UpdateColdStorageRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/cold-storage/:id
   * Delete a cold storage by ID
   */
  fastify.delete(
    '/:id',
    {
      preHandler: [validateParams],
      schema: {
        description: 'Delete a cold storage by ID',
        tags: ['cold-storage'],
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
      await controller.delete(request as FastifyRequest<DeleteColdStorageRequestParams>, reply);
    }
  );
}

export default coldStorageRoutes;
