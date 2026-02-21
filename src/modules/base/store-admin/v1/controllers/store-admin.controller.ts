import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  StoreAdminService,
  StoreAdminNotFoundError,
  StoreAdminValidationError,
} from '../services/store-admin.service.js';

import type {
  CreateStoreAdminRequest,
  UpdateStoreAdminRequest,
  LoginStoreAdminRequest,
  RegisterFarmerRequest,
} from '../types/store-admin.js';

import type {
  StoreAdminIdParam,
  StoreAdminQuery,
  CreateStoreAdminInput,
  UpdateStoreAdminInput,
  LoginStoreAdminInput,
  RegisterFarmerInput,
  DaybookQuery,
  GatePassNumberQuery,
  FarmerOrdersQuery,
  FarmerStorageLinkIdParam,
  ColdStorageAnalyticsQuery,
  VarietyInventoryAnalysisQuery,
} from '../schemas/store-admin.schema.js';

// Route-level types
interface LoginStoreAdminRequestParams {
  Body: LoginStoreAdminInput;
}

interface CreateStoreAdminRequestParams {
  Body: CreateStoreAdminInput;
}

interface UpdateStoreAdminRequestParams {
  Params: StoreAdminIdParam;
  Body: UpdateStoreAdminInput;
}

interface GetStoreAdminRequestParams {
  Params: StoreAdminIdParam;
}

interface DeleteStoreAdminRequestParams {
  Params: StoreAdminIdParam;
}

interface ListStoreAdminRequestParams {
  Querystring: StoreAdminQuery;
}

interface RegisterFarmerRequestParams {
  Body: RegisterFarmerInput;
}

interface DaybookRequestParams {
  Querystring: DaybookQuery;
}

interface GatePassNumberRequestParams {
  Querystring: GatePassNumberQuery;
}

interface FarmerOrdersRequestParams {
  Querystring: FarmerOrdersQuery;
}

interface GetFarmerByIdRequestParams {
  Params: FarmerStorageLinkIdParam;
}

interface ColdStorageAnalyticsRequestParams {
  Querystring: ColdStorageAnalyticsQuery;
}

interface VarietyInventoryAnalysisRequestParams {
  Querystring: VarietyInventoryAnalysisQuery;
}

/**
 * Controller for StoreAdmin endpoints
 */
export class StoreAdminController {
  private readonly service: StoreAdminService;

  constructor(fastify: FastifyInstance) {
    this.service = new StoreAdminService(fastify);
  }

  /**
   * POST /store-admin/login - Login store admin
   * If isMobile is true: Returns JWT token in JSON response
   * If isMobile is false or not provided: Sets JWT token in cookie (7 days validity)
   */
  async login(
    request: FastifyRequest<LoginStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await this.service.login(
        request.body as LoginStoreAdminRequest,
        request.server,
        request
      );

      const isMobile = request.body.isMobile === true;

      if (isMobile) {
        // Mobile client: return token in JSON response
        reply.code(200).send({
          success: true,
          message: 'Login successful',
          data: {
            token: result.token,
            admin: result.admin,
            coldStorage: result.coldStorage,
          },
        });
      } else {
        // Web client: set token in cookie with 7 days validity
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        reply.setCookie('jwt', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'none',
          maxAge: sevenDaysInMs / 1000, // maxAge is in seconds
          path: '/',
        });

        reply.code(200).send({
          success: true,
          message: 'Login successful',
          data: {
            admin: result.admin,
            coldStorage: result.coldStorage,
          },
        });
      }
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * POST /store-admin/logout - Logout store admin
   * Clears the JWT cookie
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      await this.service.logout();

      // Clear the JWT cookie
      reply.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      reply.code(200).send({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin - List all store admins (with pagination & search)
   */
  async getAll(
    request: FastifyRequest<ListStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { page, limit, search, coldStorageId, role, isVerified } = request.query;

      // Convert isVerified string to boolean if provided
      const isVerifiedBool =
        isVerified === 'true' ? true : isVerified === 'false' ? false : undefined;

      const result = await this.service.getAll({
        page,
        limit,
        search,
        coldStorageId,
        role,
        isVerified: isVerifiedBool,
      });

      reply.code(200).send({
        success: true,
        data: result.data,
        meta: {
          total: result.count,
          page: page ?? 1,
          limit: limit ?? 10,
          totalPages: Math.ceil(result.count / (limit ?? 10)),
        },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/:id - Get one store admin
   */
  async getById(
    request: FastifyRequest<GetStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const storeAdmin = await this.service.getById(id);

      reply.code(200).send({
        success: true,
        data: storeAdmin,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * POST /store-admin - Create new store admin
   */
  async create(
    request: FastifyRequest<CreateStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeAdmin = await this.service.create(request.body as CreateStoreAdminRequest);

      reply.code(201).send({
        success: true,
        data: storeAdmin,
        message: 'Store admin created successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * PUT /store-admin/:id - Update existing store admin
   */
  async update(
    request: FastifyRequest<UpdateStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const updated = await this.service.update(id, request.body as UpdateStoreAdminRequest);

      reply.code(200).send({
        success: true,
        data: updated,
        message: 'Store admin updated successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * DELETE /store-admin/:id - Delete store admin
   */
  async delete(
    request: FastifyRequest<DeleteStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      await this.service.delete(id);

      reply.code(200).send({
        success: true,
        message: 'Store admin deleted successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * POST /store-admin/register-farmer - Register a farmer and link to cold storage
   */
  async registerFarmer(
    request: FastifyRequest<RegisterFarmerRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorage) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const result = await this.service.registerFarmer(
        request.body as RegisterFarmerRequest,
        request.admin.id,
        request.admin.coldStorageId
      );

      reply.code(201).send({
        success: true,
        message: 'Farmer successfully linked to this cold storage',
        data: result,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /* STORE ADMIN FUNCTIONALITY */

  /**
   * GET /store-admin/daybook - Get daybook orders (incoming and outgoing)
   */
  async getDaybook(
    request: FastifyRequest<DaybookRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { type, commodity, search, sortBy, page, limit, dateFrom, dateTo } = request.query;

      const result = await this.service.getDaybook(request.admin.coldStorageId, {
        type,
        commodity,
        search,
        sortBy,
        page,
        limit,
        dateFrom,
        dateTo,
      });

      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/farmer - Get all farmers for the logged-in store admin's cold storage
   */
  async getFarmers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const result = await this.service.getFarmers(request.admin.coldStorageId);

      reply.code(200).send({
        success: true,
        data: result.data,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/farmers/:id - Get farmer details by farmerStorageLinkId
   */
  async getFarmerById(
    request: FastifyRequest<GetFarmerByIdRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { id } = request.params;
      const result = await this.service.getFarmerById(id, request.admin.coldStorageId);

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/gate-pass-number - Get the next gate pass number for a commodity
   */
  async getNextGatePassNumber(
    request: FastifyRequest<GatePassNumberRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { commodity, type } = request.query;

      if (!commodity) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Commodity is required',
          },
        });
        return;
      }

      if (!type) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type is required (incoming or outgoing)',
          },
        });
        return;
      }

      // Use original commodity so we get next number for the same bucket stored on the order (avoids duplicate)
      const result = await this.service.getNextGatePassNumber(
        request.admin.coldStorageId,
        commodity.original,
        type
      );

      reply.code(200).send({
        success: true,
        data: {
          ...result,
          commodity: commodity.original,
        },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/farmer-orders - Get all orders (incoming and outgoing) for a specific farmer
   */
  async getFarmerOrders(
    request: FastifyRequest<FarmerOrdersRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { farmerStorageLinkId, type } = request.query;

      const result = await this.service.getFarmerOrders(
        request.admin.coldStorageId,
        farmerStorageLinkId,
        type ?? 'all'
      );

      reply.code(200).send({
        success: true,
        data: result.data,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/analytics/overview - Get cold storage analytics overview
   */
  async getColdStorageAnalytics(
    request: FastifyRequest<ColdStorageAnalyticsRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { coldStorageId, dateFrom, dateTo, commodity, farmerId, locationId } = request.query;

      // Verify coldStorageId matches the authenticated admin's cold storage
      if (coldStorageId !== request.admin.coldStorageId) {
        reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this cold storage',
          },
        });
        return;
      }

      const result = await this.service.getColdStorageAnalytics({
        coldStorageId,
        dateFrom,
        dateTo,
        commodity: commodity as any,
        farmerId,
        locationId,
      });

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /store-admin/inventory/variety-analysis - Get variety-wise inventory analysis
   */
  async getVarietyInventoryAnalysis(
    request: FastifyRequest<VarietyInventoryAnalysisRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!request.admin.coldStorageId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_COLD_STORAGE',
            message: 'Missing cold storage context',
          },
        });
        return;
      }

      const { storageId, commodity, variety } = request.query;

      // Verify storageId matches the authenticated admin's cold storage
      if (storageId !== request.admin.coldStorageId) {
        reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this cold storage',
          },
        });
        return;
      }

      const result = await this.service.getVarietyInventoryAnalysis(
        storageId,
        commodity as any,
        variety
      );

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Centralized error handler
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof Error) reply.log.error(error);

    if (error instanceof StoreAdminNotFoundError) {
      reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }

    if (error instanceof StoreAdminValidationError) {
      reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
      return;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2025') {
        reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Store admin not found' },
        });
        return;
      }
      if (prismaError.code === 'P2002') {
        reply.code(409).send({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' },
        });
        return;
      }
    }

    reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected error occurred',
      },
    });
  }
}
