import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for GET /api/v1/cold-storage
 * Get all cold storages with pagination and search
 */
export const listOptions = {
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
                preferences: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    varieties: { type: 'array', items: { type: 'string' } },
                    commodities: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          sizes: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    },
                    generation: { type: 'string', nullable: true },
                    rouging: { type: 'string', nullable: true },
                    tuberType: { type: 'string', nullable: true },
                    grader: { type: 'string', nullable: true },
                  },
                },
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
 * Route options for GET /api/v1/cold-storage/:id
 * Get a single cold storage by ID
 */
export const getByIdOptions = {
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
              preferences: {
                type: 'object',
                nullable: true,
                properties: {
                  bagSizes: { type: 'array', items: { type: 'string' } },
                  commodities: { type: 'array', items: { type: 'string' } },
                  generation: { type: 'string', nullable: true },
                  rouging: { type: 'string', nullable: true },
                  tuberType: { type: 'string', nullable: true },
                  grader: { type: 'string', nullable: true },
                },
              },
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
} as RouteShorthandOptions;

/**
 * Route options for POST /api/v1/cold-storage
 * Create a new cold storage
 */
export const createOptions = {
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
              preferences: {
                type: 'object',
                nullable: true,
                properties: {
                  bagSizes: { type: 'array', items: { type: 'string' } },
                  commodities: { type: 'array', items: { type: 'string' } },
                  generation: { type: 'string', nullable: true },
                  rouging: { type: 'string', nullable: true },
                  tuberType: { type: 'string', nullable: true },
                  grader: { type: 'string', nullable: true },
                },
              },
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
} as RouteShorthandOptions;

/**
 * Route options for PUT /api/v1/cold-storage/:id
 * Update an existing cold storage
 */
export const updateOptions = {
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
              preferences: {
                type: 'object',
                nullable: true,
                properties: {
                  bagSizes: { type: 'array', items: { type: 'string' } },
                  commodities: { type: 'array', items: { type: 'string' } },
                  generation: { type: 'string', nullable: true },
                  rouging: { type: 'string', nullable: true },
                  tuberType: { type: 'string', nullable: true },
                  grader: { type: 'string', nullable: true },
                },
              },
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
} as RouteShorthandOptions;

/**
 * Route options for DELETE /api/v1/cold-storage/:id
 * Delete a cold storage by ID
 */
export const deleteOptions = {
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
} as RouteShorthandOptions;
