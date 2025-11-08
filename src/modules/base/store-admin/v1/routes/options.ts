import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for POST /api/v1/store-admin/login
 * Login store admin
 */
export const loginOptions = {
  schema: {
    description: 'Login store admin',
    tags: ['store-admin'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              admin: { type: 'object' },
              token: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/store-admin
 * Get all store admins
 */
export const listOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/store-admin/:id
 * Get a single store admin
 */
export const getByIdOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for POST /api/v1/store-admin
 * Create a new store admin
 */
export const createOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for PUT /api/v1/store-admin/:id
 * Update an existing store admin
 */
export const updateOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for DELETE /api/v1/store-admin/:id
 * Delete a store admin
 */
export const deleteOptions = {
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
} as RouteShorthandOptions;

/**
 * Route options for POST /api/v1/store-admin/register-farmer
 * Register a farmer and link to cold storage
 */
export const registerFarmerOptions = {
  schema: {
    description: 'Register a farmer and link to cold storage',
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
              farmer: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  address: { type: 'string' },
                  mobileNumber: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              link: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  farmerId: { type: 'string' },
                  coldStorageId: { type: 'string' },
                  linkedById: { type: 'string', nullable: true },
                  accountNumber: { type: 'number' },
                  isActive: { type: 'boolean' },
                  notes: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
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
      401: {
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
