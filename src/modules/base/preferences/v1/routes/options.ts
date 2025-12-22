import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for GET /api/v1/preferences
 * Get all preferences with pagination and search
 */
export const listOptions = {
  schema: {
    description: 'Get all preferences with pagination and optional search',
    tags: ['preferences'],
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
                commodities: {
                  type: 'array',
                  items: {
                    type: 'object',
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
                customFields: {
                  anyOf: [
                    {
                      type: 'object',
                      additionalProperties: true,
                    },
                    { type: 'null' },
                  ],
                  description: 'Custom user-defined fields for future customisations',
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
 * Route options for GET /api/v1/preferences/:id
 * Get a single preferences by ID
 */
export const getByIdOptions = {
  schema: {
    description: 'Get a single preferences by ID',
    tags: ['preferences'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              commodities: {
                type: 'array',
                items: {
                  type: 'object',
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
              customFields: {
                type: ['object', 'null'],
                nullable: true,
                additionalProperties: true,
                description: 'Custom user-defined fields for future customisations',
              },
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
 * Route options for POST /api/v1/preferences
 * Create a new preferences
 */
export const createOptions = {
  schema: {
    description: 'Create a new preferences',
    tags: ['preferences'],
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              commodities: {
                type: 'array',
                items: {
                  type: 'object',
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
              customFields: {
                type: ['object', 'null'],
                nullable: true,
                additionalProperties: true,
                description: 'Custom user-defined fields for future customisations',
              },
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
 * Route options for PUT /api/v1/preferences/:id
 * Update an existing preferences
 */
export const updateOptions = {
  schema: {
    description: 'Update an existing preferences',
    tags: ['preferences'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              commodities: {
                type: 'array',
                items: {
                  type: 'object',
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
              customFields: {
                type: ['object', 'null'],
                nullable: true,
                additionalProperties: true,
                description: 'Custom user-defined fields for future customisations',
              },
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
 * Route options for DELETE /api/v1/preferences/:id
 * Delete a preferences by ID
 */
export const deleteOptions = {
  schema: {
    description: 'Delete a preferences by ID',
    tags: ['preferences'],
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
