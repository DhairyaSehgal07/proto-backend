import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for POST /api/v1/store-admin/logout
 * Logout store admin (cookie clearing handled by Next.js API route)
 */
export const logoutOptions = {
  schema: {
    description: 'Logout store admin. Cookie clearing is handled by Next.js API route.',
    tags: ['store-admin'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
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
 * Route options for POST /api/v1/store-admin/login
 * Login store admin
 * If isMobile is true: Returns JWT token in JSON response
 * If isMobile is false or not provided: Sets JWT token in cookie (7 days validity)
 */
export const loginOptions = {
  schema: {
    description:
      'Login store admin. If isMobile is true, returns token in response. Otherwise, sets token in cookie.',
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
              token: {
                type: 'string',
                description: 'JWT token for authentication (only returned when isMobile is true)',
              },
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
                      incoming: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          showCustomMarka: { type: 'boolean', default: false },
                        },
                      },
                      generation: { type: 'string', nullable: true },
                      rouging: { type: 'string', nullable: true },
                      tuberType: { type: 'string', nullable: true },
                      grader: { type: 'string', nullable: true },
                      customFields: {
                        type: 'object',
                        nullable: true,
                        description: 'Custom user-defined fields for future customisations',
                      },
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
                date: { type: ['string', 'null'], format: 'date-time' },
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
                            customMarka: { type: 'string', nullable: true },
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
                rentEntry: {
                  type: ['object', 'null'],
                  properties: {
                    id: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    amount: { type: 'number' },
                    type: { type: 'string', enum: ['RENT', 'PAYMENT'] },
                    remarks: { type: 'string' },
                    createdBy: { type: ['string', 'null'] },
                    voucherId: { type: ['string', 'null'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
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
 * Route options for GET /api/v1/store-admin/farmer
 * Get all farmers for the logged-in store admin's cold storage
 */
export const getFarmersOptions = {
  schema: {
    description: "Get all farmers for the logged-in store admin's cold storage",
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
                farmerId: { type: 'string' },
                name: { type: 'string' },
                mobileNumber: { type: 'string' },
                address: { type: 'string' },
                accountNumber: { type: 'number' },
                isActive: { type: 'boolean' },
                paymentHistory: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      date: { type: 'string', format: 'date-time' },
                      amount: { type: 'number' },
                      type: { type: 'string', enum: ['RENT', 'PAYMENT'] },
                      remarks: { type: 'string' },
                      createdBy: { type: ['string', 'null'] },
                      voucherId: { type: ['string', 'null'] },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: [
                      'id',
                      'date',
                      'amount',
                      'type',
                      'remarks',
                      'createdBy',
                      'voucherId',
                      'createdAt',
                      'updatedAt',
                    ],
                  },
                },
              },
              required: [
                'id',
                'farmerId',
                'name',
                'mobileNumber',
                'address',
                'accountNumber',
                'isActive',
                'paymentHistory',
              ],
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
 * Route options for GET /api/v1/store-admin/gate-pass-number
 * Get the next gate pass number for a commodity
 */
export const getGatePassNumberOptions = {
  schema: {
    description:
      'Get the next gate pass number for a commodity (queries incoming or outgoing orders based on type)',
    tags: ['store-admin'],
    querystring: {
      type: 'object',
      properties: {
        commodity: {
          type: 'string',
          enum: ['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'],
          description: 'Commodity type to get the next gate pass number for',
        },
        type: {
          type: 'string',
          enum: ['incoming', 'outgoing'],
          description: 'Order type - determines which model to query (incoming or outgoing orders)',
        },
      },
      required: ['commodity', 'type'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              nextGatePassNumber: {
                type: 'number',
                description: 'The next gate pass number to assign (max + 1)',
              },
              commodity: {
                type: 'string',
                description: 'The commodity type',
              },
              coldStorageId: {
                type: 'string',
                description: 'The cold storage ID',
              },
              type: {
                type: 'string',
                enum: ['incoming', 'outgoing'],
                description: 'The order type that was queried',
              },
            },
            required: ['nextGatePassNumber', 'commodity', 'coldStorageId', 'type'],
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
 * Route options for GET /api/v1/store-admin/farmers/:id
 * Get farmer details by farmerStorageLinkId
 */
export const getFarmerByIdOptions = {
  schema: {
    description: 'Get farmer details by farmerStorageLinkId with populated farmer and linkedBy',
    tags: ['store-admin'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Farmer storage link ID' },
              farmerId: { type: 'string', description: 'Farmer document ID' },
              coldStorageId: { type: 'string' },
              accountNumber: { type: 'number' },
              isActive: { type: 'boolean' },
              notes: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              farmer: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  address: { type: 'string' },
                  mobileNumber: { type: 'string' },
                },
                required: ['id', 'name', 'address', 'mobileNumber'],
              },
              linkedBy: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
                required: ['id', 'name'],
              },
            },
            required: [
              'id',
              'farmerId',
              'coldStorageId',
              'accountNumber',
              'isActive',
              'notes',
              'createdAt',
              'updatedAt',
              'farmer',
              'linkedBy',
            ],
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
 * Route options for GET /api/v1/store-admin/farmer-orders
 * Get all orders (incoming and outgoing) for a specific farmer
 */
export const getFarmerOrdersOptions = {
  schema: {
    description:
      'Get all orders (incoming and outgoing) for a specific farmer. No pagination - returns all orders.',
    tags: ['store-admin'],
    querystring: {
      type: 'object',
      properties: {
        farmerStorageLinkId: {
          type: 'string',
          description: 'Farmer storage link ID to get orders for',
        },
        type: {
          type: 'string',
          enum: ['all', 'incoming', 'outgoing'],
          default: 'all',
          description: 'Filter by order type: all, incoming, or outgoing',
        },
      },
      required: ['farmerStorageLinkId'],
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
                            customMarka: { type: 'string', nullable: true },
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
                rentEntry: {
                  type: ['object', 'null'],
                  properties: {
                    id: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    amount: { type: 'number' },
                    type: { type: 'string', enum: ['RENT', 'PAYMENT'] },
                    remarks: { type: 'string' },
                    createdBy: { type: ['string', 'null'] },
                    voucherId: { type: ['string', 'null'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
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
 * Route options for GET /api/v1/store-admin/inventory/variety-analysis
 * Get variety-wise inventory analysis for a given storage
 */
export const varietyInventoryAnalysisOptions = {
  schema: {
    description:
      'Get variety-wise inventory analysis for a given storage. Returns farmers with their available quantities grouped by bag size, and location-wise aggregation of quantities.',
    tags: ['store-admin'],
    querystring: {
      type: 'object',
      properties: {
        storageId: {
          type: 'string',
          description: 'Cold storage ID (required)',
        },
        commodity: {
          type: 'string',
          enum: ['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'],
          description: 'Commodity type (required)',
        },
        variety: {
          type: 'string',
          description: 'Variety name (required)',
        },
      },
      required: ['storageId', 'commodity', 'variety'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              commodity: { type: 'string' },
              variety: { type: 'string' },
              farmers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    farmerId: { type: 'string' },
                    farmerName: { type: 'string' },
                    sizes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          size: { type: 'string' },
                          totalInitial: { type: 'number' },
                          totalCurrent: { type: 'number' },
                          totalOutgoing: { type: 'number' },
                        },
                        required: ['size', 'totalInitial', 'totalCurrent', 'totalOutgoing'],
                      },
                    },
                    totalInitial: { type: 'number' },
                    totalCurrent: { type: 'number' },
                    totalOutgoing: { type: 'number' },
                  },
                  required: [
                    'farmerId',
                    'farmerName',
                    'sizes',
                    'totalInitial',
                    'totalCurrent',
                    'totalOutgoing',
                  ],
                },
              },
              locations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    location: {
                      type: 'object',
                      properties: {
                        chamber: { type: 'string' },
                        floor: { type: 'string' },
                        row: { type: 'string' },
                      },
                      required: ['chamber', 'floor', 'row'],
                    },
                    totalInitial: { type: 'number' },
                    totalCurrent: { type: 'number' },
                    totalOutgoing: { type: 'number' },
                    sizes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          size: { type: 'string' },
                          totalInitial: { type: 'number' },
                          totalCurrent: { type: 'number' },
                          totalOutgoing: { type: 'number' },
                        },
                        required: ['size', 'totalInitial', 'totalCurrent', 'totalOutgoing'],
                      },
                    },
                  },
                  required: ['location', 'totalInitial', 'totalCurrent', 'totalOutgoing', 'sizes'],
                },
              },
            },
            required: ['commodity', 'variety', 'farmers', 'locations'],
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
      403: {
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
 * Route options for GET /api/v1/store-admin/analytics/overview
 * Get cold storage analytics overview
 */
export const coldStorageAnalyticsOptions = {
  schema: {
    description:
      'Get cold storage analytics overview with summary, commodity breakdown, stock trends, and location analytics',
    tags: ['store-admin'],
    querystring: {
      type: 'object',
      properties: {
        coldStorageId: {
          type: 'string',
          description: 'Cold storage ID (required)',
        },
        dateFrom: {
          type: 'string',
          format: 'date-time',
          description: 'Start date for filtering (ISO 8601 format)',
        },
        dateTo: {
          type: 'string',
          format: 'date-time',
          description: 'End date for filtering (ISO 8601 format)',
        },
        commodity: {
          type: 'string',
          enum: ['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'],
          description: 'Filter by commodity type',
        },
        farmerId: {
          type: 'string',
          description: 'Filter by farmer storage link ID',
        },
        locationId: {
          type: 'string',
          description: 'Filter by location ID',
        },
      },
      required: ['coldStorageId'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              meta: {
                type: 'object',
                properties: {
                  coldStorageId: { type: 'string' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  unit: { type: 'string' },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  totalBagsInitial: { type: 'number' },
                  totalBagsCurrent: { type: 'number' },
                  totalIncomingBags: { type: 'number' },
                  totalOutgoingBags: { type: 'number' },
                },
              },
              commoditySummary: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    commodity: { type: 'string' },
                    totalCurrent: { type: 'number' },
                    varieties: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          varietyName: { type: 'string' },
                          totalCurrent: { type: 'number' },
                          bagSizes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                size: { type: 'string' },
                                totalInitial: { type: 'number' },
                                totalCurrent: { type: 'number' },
                                totalOutgoing: { type: 'number' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              stockTrend: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date-time' },
                    incoming: { type: 'number' },
                    outgoing: { type: 'number' },
                    netChange: { type: 'number' },
                    totalStock: { type: 'number' },
                  },
                },
              },
              locationAnalytics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    locationId: { type: 'string' },
                    floor: { type: 'string' },
                    row: { type: 'string' },
                    chamber: { type: 'string' },
                    totalCurrentBags: { type: 'number' },
                    breakdownByFarmer: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          farmerId: { type: 'string' },
                          farmerName: { type: 'string' },
                          accountNumber: { type: 'number' },
                          totalCurrentBags: { type: 'number' },
                          details: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                commodity: { type: 'string' },
                                variety: { type: 'string' },
                                size: { type: 'string' },
                                storedOn: { type: 'string', format: 'date-time' },
                                initialQuantity: { type: 'number' },
                                currentQuantity: { type: 'number' },
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
