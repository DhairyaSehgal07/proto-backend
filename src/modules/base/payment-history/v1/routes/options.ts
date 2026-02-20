import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for GET /api/v1/payment-history
 * Get all payment histories
 */
export const listOptions = {
  schema: {
    description: 'Get all payment histories with pagination and filters',
    tags: ['payment-history'],
    querystring: {
      type: 'object',
      properties: {
        farmerStorageLinkId: {
          type: 'string',
          description: 'Filter by farmer storage link ID',
        },
        type: {
          type: 'string',
          enum: ['RENT', 'PAYMENT', 'EXPENSE'],
          description: 'Filter by payment type',
        },
        dateFrom: {
          type: 'string',
          format: 'date-time',
          description: 'Filter payments from this date',
        },
        dateTo: {
          type: 'string',
          format: 'date-time',
          description: 'Filter payments until this date',
        },
        page: {
          type: 'number',
          minimum: 1,
          default: 1,
          description: 'Page number',
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 10,
          description: 'Items per page',
        },
      },
    },
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
                farmerStorageLinkId: { type: 'string' },
                date: { type: 'string', format: 'date-time' },
                amount: { type: 'number' },
                type: { type: 'string', enum: ['RENT', 'PAYMENT', 'EXPENSE'] },
                remarks: { type: 'string' },
                createdBy: { type: 'string', nullable: true },
                voucherId: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: { type: 'number' },
              totalPages: { type: 'number' },
              totalItems: { type: 'number' },
              itemsPerPage: { type: 'number' },
              hasNextPage: { type: 'boolean' },
              hasPreviousPage: { type: 'boolean' },
              nextPage: { type: 'number', nullable: true },
              previousPage: { type: 'number', nullable: true },
            },
          },
        },
      },
    },
  },
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/payment-history/:id
 * Get a single payment history
 */
export const getByIdOptions = {
  schema: {
    description: 'Get a single payment history by ID',
    tags: ['payment-history'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              farmerStorageLinkId: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              amount: { type: 'number' },
              type: { type: 'string', enum: ['RENT', 'PAYMENT', 'EXPENSE'] },
              remarks: { type: 'string' },
              createdBy: { type: 'string', nullable: true },
              voucherId: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              farmerStorageLink: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  accountNumber: { type: 'number' },
                  farmer: {
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
 * Route options for POST /api/v1/payment-history
 * Create a new payment history
 */
export const createOptions = {
  schema: {
    description: 'Create a new payment history',
    tags: ['payment-history'],
    body: {
      type: 'object',
      required: ['farmerStorageLinkId', 'date', 'amount', 'type'],
      properties: {
        farmerStorageLinkId: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        amount: { type: 'number', minimum: 0 },
        type: { type: 'string', enum: ['RENT', 'PAYMENT', 'EXPENSE'] },
        remarks: { type: 'string' },
        createdBy: { type: 'string', nullable: true },
        voucherId: { type: 'string', nullable: true },
      },
    },
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
              farmerStorageLinkId: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              amount: { type: 'number' },
              type: { type: 'string', enum: ['RENT', 'PAYMENT', 'EXPENSE'] },
              remarks: { type: 'string' },
              createdBy: { type: 'string', nullable: true },
              voucherId: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
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
 * Route options for PUT /api/v1/payment-history/:id
 * Update an existing payment history
 */
export const updateOptions = {
  schema: {
    description: 'Update an existing payment history',
    tags: ['payment-history'],
    body: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date-time' },
        amount: { type: 'number', minimum: 0 },
        type: { type: 'string', enum: ['RENT', 'PAYMENT', 'EXPENSE'] },
        remarks: { type: 'string' },
        voucherId: { type: 'string', nullable: true },
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
              id: { type: 'string' },
              farmerStorageLinkId: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              amount: { type: 'number' },
              type: { type: 'string', enum: ['RENT', 'PAYMENT', 'EXPENSE'] },
              remarks: { type: 'string' },
              createdBy: { type: 'string', nullable: true },
              voucherId: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
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
 * Route options for DELETE /api/v1/payment-history/:id
 * Delete a payment history
 */
export const deleteOptions = {
  schema: {
    description: 'Delete a payment history by ID',
    tags: ['payment-history'],
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
