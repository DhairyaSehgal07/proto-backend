import type { RouteShorthandOptions } from 'fastify';

/**
 * Route options for POST /api/v1/outgoing-orders
 * Create a new outgoing order
 */
export const createOptions = {
  schema: {
    description: 'Create a new outgoing order',
    tags: ['outgoing-orders'],
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
                              locationId: { type: 'string' },
                              incomingOrderId: { type: 'string' },
                              varietyName: { type: 'string' },
                              quantityBefore: { type: 'number' },
                              quantityRemoved: { type: 'number' },
                              quantityAfter: { type: 'number' },
                              approxWeight: { type: ['number', 'null'] },
                            },
                          },
                        },
                      },
                    },
                  },
                  totalBags: { type: ['number', 'null'] },
                  totalWeight: { type: ['number', 'null'] },
                  createdById: { type: ['string', 'null'] },
                  approvedById: { type: ['string', 'null'] },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
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
                    type: 'object',
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
 * Route options for PUT /api/v1/outgoing-orders/:id
 * Update an existing outgoing order
 */
export const updateOptions = {
  schema: {
    description: 'Update an existing outgoing order',
    tags: ['outgoing-orders'],
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
                              locationId: { type: 'string' },
                              floor: { type: ['string', 'null'] },
                              row: { type: ['string', 'null'] },
                              chamber: { type: ['string', 'null'] },
                              incomingOrderId: { type: 'string' },
                              varietyName: { type: 'string' },
                              quantityBefore: { type: 'number' },
                              quantityRemoved: { type: 'number' },
                              quantityAfter: { type: 'number' },
                              approxWeight: { type: ['number', 'null'] },
                            },
                          },
                        },
                      },
                    },
                  },
                  totalBags: { type: ['number', 'null'] },
                  totalWeight: { type: ['number', 'null'] },
                  createdById: { type: ['string', 'null'] },
                  approvedById: { type: ['string', 'null'] },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
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
                    type: 'object',
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
 * Route options for GET /api/v1/outgoing-orders
 * Get all outgoing orders for cold storage
 */
export const listOptions = {
  schema: {
    description: 'Get all outgoing orders for cold storage with pagination and filters',
    tags: ['outgoing-orders'],
    querystring: {
      type: 'object',
      properties: {
        commodity: { type: 'string' },
        gatePassType: { type: 'string' },
        search: { type: 'string' },
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 },
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
                            locationId: { type: 'string' },
                            floor: { type: ['string', 'null'] },
                            row: { type: ['string', 'null'] },
                            chamber: { type: ['string', 'null'] },
                            incomingOrderId: { type: 'string' },
                            varietyName: { type: 'string' },
                            quantityBefore: { type: 'number' },
                            quantityRemoved: { type: 'number' },
                            quantityAfter: { type: 'number' },
                            approxWeight: { type: ['number', 'null'] },
                          },
                        },
                      },
                    },
                  },
                },
                totalBags: { type: ['number', 'null'] },
                totalWeight: { type: ['number', 'null'] },
                createdById: { type: ['string', 'null'] },
                approvedById: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
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
                  type: 'object',
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
 * Route options for GET /api/v1/outgoing-orders/farmer
 * Get all outgoing orders for a specific farmer
 */
export const getByFarmerOptions = {
  schema: {
    description: 'Get all outgoing orders for a specific farmer',
    tags: ['outgoing-orders'],
    querystring: {
      type: 'object',
      properties: {
        farmerStorageLinkId: { type: 'string' },
        commodity: { type: 'string' },
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 },
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
                            locationId: { type: 'string' },
                            floor: { type: ['string', 'null'] },
                            row: { type: ['string', 'null'] },
                            chamber: { type: ['string', 'null'] },
                            incomingOrderId: { type: 'string' },
                            varietyName: { type: 'string' },
                            quantityBefore: { type: 'number' },
                            quantityRemoved: { type: 'number' },
                            quantityAfter: { type: 'number' },
                            approxWeight: { type: ['number', 'null'] },
                          },
                        },
                      },
                    },
                  },
                },
                totalBags: { type: ['number', 'null'] },
                totalWeight: { type: ['number', 'null'] },
                createdById: { type: ['string', 'null'] },
                approvedById: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
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
                  type: 'object',
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
 * Route options for DELETE /api/v1/outgoing-orders/:id
 * Delete an outgoing order
 */
export const deleteOptions = {
  schema: {
    description: 'Delete an outgoing order by ID',
    tags: ['outgoing-orders'],
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
