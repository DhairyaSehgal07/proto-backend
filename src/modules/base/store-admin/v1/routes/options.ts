import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for POST /api/v1/store-admin/logout
 * Logout store admin
 */
export const logoutOptions = {
  schema: {
    description: 'Logout store admin',
    tags: ['store-admin'],
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
              admin: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  coldStorageId: { type: 'string' },
                  name: { type: 'string' },
                  personalAddress: { type: 'string', nullable: true },
                  mobileNumber: { type: 'string' },
                  role: { type: 'string', enum: ['Admin', 'Manager', 'Assistant'] },
                  isVerified: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
                required: [
                  'id',
                  'coldStorageId',
                  'name',
                  'mobileNumber',
                  'role',
                  'isVerified',
                  'createdAt',
                  'updatedAt',
                ],
              },
              coldStorage: {
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
                  plan: { type: 'string', enum: ['Basic', 'Pro', 'Enterprise'] },
                  preferences: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      varieties: {
                        type: 'array',
                        items: { type: 'string' },
                      },
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
                required: [
                  'id',
                  'name',
                  'address',
                  'mobileNumber',
                  'capacity',
                  'isPaid',
                  'isActive',
                  'plan',
                  'preferences',
                  'createdAt',
                  'updatedAt',
                ],
              },
            },
            required: ['admin', 'coldStorage'],
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

/**
 * Route options for GET /api/v1/store-admin/daybook
 * Get daybook orders (incoming and outgoing)
 */
export const daybookOptions = {
  schema: {
    description:
      'Get daybook orders (incoming and outgoing) with pagination, filtering, and sorting',
    tags: ['store-admin'],
    querystring: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['all', 'incoming', 'outgoing'],
          default: 'all',
          description: 'Filter by order type',
        },
        commodity: {
          type: 'string',
          enum: ['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'],
          description: 'Filter by commodity',
        },
        search: {
          type: 'string',
          description: 'Search by gate pass number',
        },
        sortBy: {
          type: 'string',
          enum: ['latest', 'oldest'],
          default: 'latest',
          description: 'Sort order by creation date',
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
                type: { type: 'string', enum: ['incoming', 'outgoing'] },
                farmerStorageLinkId: { type: 'string' },
                coldStorageId: { type: 'string', nullable: true },
                commodity: { type: 'string' },
                gatePassType: { type: 'string' },
                gatePassNumber: { type: 'number' },
                remarks: { type: 'string', nullable: true },
                currentStockAtThatTime: { type: 'number', nullable: true },
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
                        address: { type: 'string' },
                        mobileNumber: { type: 'string' },
                        imageUrl: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
                varieties: {
                  type: 'array',
                  nullable: true,
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      bagSizes: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            quantityInit: { type: 'number' },
                            quantityCurr: { type: 'number' },
                            approxWeight: { type: 'number', nullable: true },
                            locationId: { type: 'string' },
                            incomingOrderId: { type: 'string', nullable: true },
                            floor: { type: 'string', nullable: true },
                            row: { type: 'string', nullable: true },
                            chamber: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
                totalBags: { type: 'number', nullable: true },
                totalWeight: { type: 'number', nullable: true },
                createdBy: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
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
