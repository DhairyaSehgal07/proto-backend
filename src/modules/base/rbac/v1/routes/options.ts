import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for POST /api/v1/base/rbac/permissions
 * Create or update role permissions (Admin role only)
 */
export const createOrUpdateRolePermissionOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/base/rbac/permissions/:coldStorageId/:role
 * Get role permissions for a specific role (Admin role only)
 */
export const getRolePermissionOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/base/rbac/permissions/:coldStorageId
 * Get all role permissions for a cold storage (Admin role only)
 */
export const getAllRolePermissionsOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for DELETE /api/v1/base/rbac/permissions/:coldStorageId/:role
 * Deactivate role permissions (Admin role only)
 */
export const deactivateRolePermissionOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/base/rbac/admins/:coldStorageId
 * Get all admins in a cold storage (Admin role only)
 */
export const getColdStorageAdminsOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/base/rbac/my-permissions
 * Get current admin's permissions (Authenticated admin)
 */
export const getMyPermissionsOptions = {
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
} as RouteShorthandOptions;
