import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for POST /api/v1/incoming-orders
 * Create a new incoming order
 */
export const createOptions = {
  schema: {
    description: 'Create a new incoming order',
    tags: ['incoming-orders'],
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              order: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  farmerStorageLinkId: { type: 'string' },
                  coldStorageId: { type: ['string', 'null'] },
                  commodity: { type: 'string' },
                  gatePassType: { type: 'string' },
                  gatePassNumber: { type: 'number' },
                  remarks: { type: ['string', 'null'] },
                  currentStockAtThatTime: { type: ['number', 'null'] },
                  varieties: {
                    type: 'array',
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
                              approxWeight: { type: ['number', 'null'] },
                              customMarka: { type: ['string', 'null'] },
                              locationId: { type: 'string' },
                              floor: { type: ['string', 'null'] },
                              row: { type: ['string', 'null'] },
                              chamber: { type: ['string', 'null'] },
                            },
                          },
                        },
                      },
                    },
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdById: { type: ['string', 'null'] },
                  farmerStorageLink: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      farmer: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          address: { type: 'string' },
                          mobileNumber: { type: 'string' },
                          imageUrl: { type: ['string', 'null'] },
                        },
                      },
                    },
                  },
                  createdBy: {
                    type: ['object', 'null'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
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
      409: {
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
 * Route options for GET /api/v1/incoming-orders
 * Get all incoming orders for cold storage
 */
export const listOptions = {
  schema: {
    description: 'Get all incoming orders for cold storage with pagination and filters',
    tags: ['incoming-orders'],
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
                coldStorageId: { type: 'string' },
                commodity: { type: 'string' },
                gatePassType: { type: 'string', enum: ['RECEIPT', 'ISSUE'] },
                gatePassNumber: { type: 'number' },
                remarks: { type: 'string' },
                currentStockAtThatTime: { type: 'number' },
                varieties: {
                  type: 'array',
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
                            approxWeight: { type: ['number', 'null'] },
                            locationId: { type: 'string' },
                            floor: { type: ['string', 'null'] },
                            row: { type: ['string', 'null'] },
                            chamber: { type: ['string', 'null'] },
                          },
                          required: ['name', 'quantityInit', 'quantityCurr', 'locationId'],
                        },
                      },
                    },
                    required: ['name', 'bagSizes'],
                  },
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                createdById: { type: ['string', 'null'] },
                farmerStorageLink: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    farmer: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        address: { type: 'string' },
                        mobileNumber: { type: 'string' },
                        imageUrl: { type: ['string', 'null'] },
                      },
                      required: ['id', 'name', 'address', 'mobileNumber', 'imageUrl'],
                    },
                  },
                  required: ['id', 'farmer'],
                },
                createdBy: {
                  type: ['object', 'null'],
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
              required: [
                'id',
                'farmerStorageLinkId',
                'coldStorageId',
                'commodity',
                'gatePassType',
                'gatePassNumber',
                'remarks',
                'currentStockAtThatTime',
                'varieties',
                'createdAt',
                'updatedAt',
                'farmerStorageLink',
              ],
            },
          },

          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    },
  },
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/incoming-orders/farmer
 * Get all incoming orders for a specific farmer
 */
export const getByFarmerOptions = {
  schema: {
    description: 'Get all incoming orders for a specific farmer',
    tags: ['incoming-orders'],
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
                coldStorageId: { type: ['string', 'null'] },
                commodity: { type: 'string' },
                gatePassType: { type: 'string' },
                gatePassNumber: { type: 'number' },
                remarks: { type: ['string', 'null'] },
                currentStockAtThatTime: { type: ['number', 'null'] },
                varieties: {
                  type: 'array',
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
                            approxWeight: { type: ['number', 'null'] },
                            locationId: { type: 'string' },
                            floor: { type: ['string', 'null'] },
                            row: { type: ['string', 'null'] },
                            chamber: { type: ['string', 'null'] },
                          },
                        },
                      },
                    },
                  },
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                createdById: { type: ['string', 'null'] },
                farmerStorageLink: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    farmer: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        address: { type: 'string' },
                        mobileNumber: { type: 'string' },
                        imageUrl: { type: ['string', 'null'] },
                      },
                    },
                  },
                },
                createdBy: {
                  type: ['object', 'null'],
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    },
  },
} as RouteShorthandOptions;

/**
 * Route options for GET /api/v1/incoming-orders/:id
 * Get a single incoming order
 */
export const getByIdOptions = {
  schema: {
    description: 'Get a single incoming order by ID',
    tags: ['incoming-orders'],
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
              coldStorageId: { type: ['string', 'null'] },
              commodity: { type: 'string' },
              gatePassType: { type: 'string' },
              gatePassNumber: { type: 'number' },
              remarks: { type: ['string', 'null'] },
              currentStockAtThatTime: { type: ['number', 'null'] },

              varieties: {
                type: 'array',
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
                          approxWeight: { type: ['number', 'null'] },
                          locationId: { type: 'string' },
                          floor: { type: ['string', 'null'] },
                          row: { type: ['string', 'null'] },
                          chamber: { type: ['string', 'null'] },
                        },
                        required: ['name', 'quantityInit', 'quantityCurr', 'locationId'],
                      },
                    },
                  },
                  required: ['name', 'bagSizes'],
                },
              },

              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              createdById: { type: ['string', 'null'] },

              farmerStorageLink: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  farmer: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      address: { type: 'string' },
                      mobileNumber: { type: 'string' },
                      imageUrl: { type: ['string', 'null'] },
                    },
                    required: ['id', 'name', 'address', 'mobileNumber'],
                  },
                },
                required: ['id', 'farmer'],
              },
              createdBy: {
                type: ['object', 'null'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
            required: [
              'id',
              'farmerStorageLinkId',
              'commodity',
              'gatePassType',
              'gatePassNumber',
              'varieties',
              'createdAt',
              'updatedAt',
              'farmerStorageLink',
            ],
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
 * Route options for PUT /api/v1/incoming-orders/:id
 * Update an existing incoming order
 */
export const updateOptions = {
  schema: {
    description: 'Update an existing incoming order',
    tags: ['incoming-orders'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              order: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  farmerStorageLinkId: { type: 'string' },
                  coldStorageId: { type: ['string', 'null'] },
                  commodity: { type: 'string' },
                  gatePassType: { type: 'string' },
                  gatePassNumber: { type: 'number' },
                  remarks: { type: ['string', 'null'] },
                  currentStockAtThatTime: { type: ['number', 'null'] },
                  varieties: {
                    type: 'array',
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
                              approxWeight: { type: ['number', 'null'] },
                              customMarka: { type: ['string', 'null'] },
                              locationId: { type: 'string' },
                              floor: { type: ['string', 'null'] },
                              row: { type: ['string', 'null'] },
                              chamber: { type: ['string', 'null'] },
                            },
                          },
                        },
                      },
                    },
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdById: { type: ['string', 'null'] },
                  farmerStorageLink: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      farmer: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          address: { type: 'string' },
                          mobileNumber: { type: 'string' },
                          imageUrl: { type: ['string', 'null'] },
                        },
                      },
                    },
                  },
                  createdBy: {
                    type: ['object', 'null'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
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
 * Route options for DELETE /api/v1/incoming-orders/:id
 * Delete an incoming order
 */
export const deleteOptions = {
  schema: {
    description: 'Delete an incoming order by ID',
    tags: ['incoming-orders'],
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
