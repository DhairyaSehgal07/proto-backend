import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { RBACController } from '../controllers/rbac.controller.js';
import {
  createOrUpdateRolePermissionSchema,
  roleParamSchema,
  coldStorageIdParamSchema,
  type CreateOrUpdateRolePermissionInput,
  type RoleParam,
  type ColdStorageIdParam,
} from '../schemas/rbac.schema.js';
import { authenticateAdmin, requireAdmin } from '@/core/middleware/auth.middleware.js';

/**
 * Request/Response types
 */
interface CreateOrUpdateRolePermissionRequestParams {
  Body: CreateOrUpdateRolePermissionInput;
}

interface GetRolePermissionRequestParams {
  Params: ColdStorageIdParam & RoleParam;
}

interface GetAllRolePermissionsRequestParams {
  Params: ColdStorageIdParam;
}

interface DeactivateRolePermissionRequestParams {
  Params: ColdStorageIdParam & RoleParam;
}

interface GetColdStorageAdminsRequestParams {
  Params: ColdStorageIdParam;
}

/**
 * Body validator factory
 */
function createBodyValidator(schema: typeof createOrUpdateRolePermissionSchema) {
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
 * Params validator
 */
function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const params = request.params as Record<string, string>;

    // Validate coldStorageId if present
    if (params.coldStorageId) {
      coldStorageIdParamSchema
        .pick({ coldStorageId: true })
        .parse({ coldStorageId: params.coldStorageId });
    }

    // Validate role if present
    if (params.role) {
      roleParamSchema.pick({ role: true }).parse({ role: params.role });
    }

    done();
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
 * Fastify route plugin for RBAC API
 */
function rbacRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new RBACController(fastify);

  /**
   * POST /api/v1/base/rbac/permissions
   * Create or update role permissions (Admin role only)
   */
  fastify.post(
    '/permissions',
    {
      preHandler: [
        authenticateAdmin,
        requireAdmin,
        createBodyValidator(createOrUpdateRolePermissionSchema),
      ],
      schema: {
        description: 'Create or update role permissions for a specific role in a cold storage',
        tags: ['rbac'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  coldStorageId: { type: 'string' },
                  role: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        resource: { type: 'string' },
                        operations: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                  },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  coldStorage: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      address: { type: 'string' },
                    },
                  },
                  createdBy: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      mobileNumber: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.createOrUpdateRolePermissions(
        request as FastifyRequest<CreateOrUpdateRolePermissionRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/permissions/:coldStorageId/:role
   * Get role permissions for a specific role (Admin role only)
   */
  fastify.get(
    '/permissions/:coldStorageId/:role',
    {
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
      schema: {
        description: 'Get role permissions for a specific role in a cold storage',
        tags: ['rbac'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  coldStorageId: { type: 'string' },
                  role: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        resource: { type: 'string' },
                        operations: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                  },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  coldStorage: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      address: { type: 'string' },
                    },
                  },
                  createdBy: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      mobileNumber: { type: 'string' },
                    },
                  },
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
      await controller.getRolePermissions(
        request as FastifyRequest<GetRolePermissionRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/permissions/:coldStorageId
   * Get all role permissions for a cold storage (Admin role only)
   */
  fastify.get(
    '/permissions/:coldStorageId',
    {
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
      schema: {
        description: 'Get all role permissions for a cold storage',
        tags: ['rbac'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAllRolePermissions(
        request as FastifyRequest<GetAllRolePermissionsRequestParams>,
        reply
      );
    }
  );

  /**
   * DELETE /api/v1/base/rbac/permissions/:coldStorageId/:role
   * Deactivate role permissions (Admin role only)
   */
  fastify.delete(
    '/permissions/:coldStorageId/:role',
    {
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
      schema: {
        description: 'Deactivate role permissions for a specific role',
        tags: ['rbac'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.deactivateRolePermissions(
        request as FastifyRequest<DeactivateRolePermissionRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/admins/:coldStorageId
   * Get all admins in a cold storage (Admin role only)
   */
  fastify.get(
    '/admins/:coldStorageId',
    {
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
      schema: {
        description: 'Get all admins in a cold storage',
        tags: ['rbac'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  byRole: {
                    type: 'object',
                    properties: {
                      Admin: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            mobileNumber: { type: 'string' },
                            role: { type: 'string' },
                            isVerified: { type: 'boolean' },
                            coldStorageId: { type: 'string' },
                          },
                        },
                      },
                      Manager: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            mobileNumber: { type: 'string' },
                            role: { type: 'string' },
                            isVerified: { type: 'boolean' },
                            coldStorageId: { type: 'string' },
                          },
                        },
                      },
                      Assistant: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            mobileNumber: { type: 'string' },
                            role: { type: 'string' },
                            isVerified: { type: 'boolean' },
                            coldStorageId: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  all: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        mobileNumber: { type: 'string' },
                        role: { type: 'string' },
                        isVerified: { type: 'boolean' },
                        coldStorageId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getColdStorageAdmins(
        request as FastifyRequest<GetColdStorageAdminsRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/my-permissions
   * Get current admin's permissions (Authenticated admin)
   */
  fastify.get(
    '/my-permissions',
    {
      preHandler: [authenticateAdmin],
      schema: {
        description: 'Get current admin permissions',
        tags: ['rbac'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  coldStorage: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      address: { type: 'string' },
                    },
                  },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        resource: { type: 'string' },
                        operations: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getMyPermissions(request, reply);
    }
  );
}

export default rbacRoutes;
