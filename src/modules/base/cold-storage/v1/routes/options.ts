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
                    commodities: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          varieties: { type: 'array', items: { type: 'string' } },
                          sizes: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['name'],
                      },
                    },
                    generation: { type: 'string', nullable: true },
                    rouging: { type: 'string', nullable: true },
                    tuberType: { type: 'string', nullable: true },
                    grader: { type: 'string', nullable: true },
                    incoming: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        showCustomMarka: { type: 'boolean' },
                      },
                    },
                    customFields: { type: 'object', nullable: true },
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
                  commodities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        varieties: { type: 'array', items: { type: 'string' } },
                        sizes: { type: 'array', items: { type: 'string' } },
                      },
                      required: ['name'],
                    },
                  },
                  generation: { type: 'string', nullable: true },
                  rouging: { type: 'string', nullable: true },
                  tuberType: { type: 'string', nullable: true },
                  grader: { type: 'string', nullable: true },
                  incoming: {
                    type: 'object',
                    properties: {
                      showCustomMarka: { type: 'boolean' },
                    },
                  },
                  customFields: { type: 'object', nullable: true },
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
    body: {
      type: 'object',
      required: ['name', 'address', 'mobileNumber', 'capacity'],
      properties: {
        name: { type: 'string', minLength: 2 },
        address: { type: 'string', minLength: 5 },
        mobileNumber: { type: 'string', pattern: '^[0-9]{10}$' },
        capacity: { type: 'number', minimum: 0 },
        imageUrl: { type: 'string', format: 'uri' },
        isPaid: { type: 'boolean' },
        isActive: { type: 'boolean' },
        plan: { type: 'string', enum: ['Basic', 'Pro', 'Enterprise'] },
        preferences: {
          type: 'object',
          properties: {
            commodities: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  varieties: { type: 'array', items: { type: 'string' } },
                  sizes: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            generation: { type: 'string', nullable: true },
            rouging: { type: 'string', nullable: true },
            tuberType: { type: 'string', nullable: true },
            grader: { type: 'string', nullable: true },
            incoming: {
              type: 'object',
              properties: {
                showCustomMarka: { type: 'boolean' },
              },
            },
            customFields: { type: 'object', nullable: true },
          },
        },
      },
    },
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
                  commodities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        varieties: { type: 'array', items: { type: 'string' } },
                        sizes: { type: 'array', items: { type: 'string' } },
                      },
                      required: ['name'],
                    },
                  },
                  generation: { type: 'string', nullable: true },
                  rouging: { type: 'string', nullable: true },
                  tuberType: { type: 'string', nullable: true },
                  grader: { type: 'string', nullable: true },
                  incoming: {
                    type: 'object',
                    properties: {
                      showCustomMarka: { type: 'boolean' },
                    },
                  },
                  customFields: { type: 'object', nullable: true },
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
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['path', 'message'],
                  properties: {
                    path: { type: 'string' },
                    message: { type: 'string' },
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
                  commodities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        varieties: { type: 'array', items: { type: 'string' } },
                        sizes: { type: 'array', items: { type: 'string' } },
                      },
                      required: ['name'],
                    },
                  },
                  generation: { type: 'string', nullable: true },
                  rouging: { type: 'string', nullable: true },
                  tuberType: { type: 'string', nullable: true },
                  grader: { type: 'string', nullable: true },
                  incoming: {
                    type: 'object',
                    properties: {
                      showCustomMarka: { type: 'boolean' },
                    },
                  },
                  customFields: { type: 'object', nullable: true },
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
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['path', 'message'],
                  properties: {
                    path: { type: 'string' },
                    message: { type: 'string' },
                  },
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
