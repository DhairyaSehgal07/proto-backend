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
  RefreshTokenRequest,
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
   * Security: Uses refresh token pattern, tokens stored securely
   */
  async login(
    request: FastifyRequest<LoginStoreAdminRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const loginData = request.body as LoginStoreAdminRequest;
      const isMobile = loginData.isMobile ?? false;

      const result = await this.service.login(loginData, request.server, request);

      // For mobile: Store refresh token securely, return access token
      // For web: Use HTTP-only cookies for both tokens
      if (isMobile) {
        // Mobile: Return access token in response (short-lived, 15 minutes)
        // Refresh token should be stored securely in device storage (not localStorage)
        reply.code(200).send({
          success: true,
          message: 'Login successful',
          data: {
            admin: result.admin,
            coldStorage: result.coldStorage,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken, // Client must store this securely
          },
        });
      } else {
        // Web: Store both tokens in HTTP-only cookies
        // Access token cookie
        reply.setCookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes in seconds
        });

        // Refresh token cookie
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });

        // Send response without tokens
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
   * POST /store-admin/refresh - Refresh access token
   */
  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const refreshTokenData = request.body;

      // Get refresh token from body or cookie
      const refreshToken = refreshTokenData.refreshToken || request.cookies.refreshToken;

      if (!refreshToken) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token is required',
          },
        });
        return;
      }

      const result = await this.service.refreshToken({ refreshToken }, request.server, request);

      const isMobile = request.headers['user-agent']?.includes('Mobile') ?? false;

      if (isMobile) {
        // Mobile: Return new tokens
        reply.code(200).send({
          success: true,
          data: result,
        });
      } else {
        // Web: Update cookies
        reply.setCookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes
        });

        if (result.refreshToken !== refreshToken) {
          // If refresh token was rotated, update cookie
          reply.setCookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
        }

        reply.code(200).send({
          success: true,
          message: 'Token refreshed successfully',
        });
      }
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * POST /store-admin/logout - Logout store admin
   * Invalidates refresh token from database
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Get refresh token from cookie or body
      const refreshToken =
        request.cookies.refreshToken || (request.body as { refreshToken?: string })?.refreshToken;

      if (refreshToken) {
        // Invalidate refresh token in database
        await this.service.logout(refreshToken);
      }

      // Clear cookies
      reply.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      reply.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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

      const { type, commodity, search, sortBy, page, limit } = request.query;

      const result = await this.service.getDaybook(request.admin.coldStorageId, {
        type,
        commodity,
        search,
        sortBy,
        page,
        limit,
      });
      console.log('result is: ', result.data[0].varieties?.[0].bagSizes?.[0].incomingOrderId);

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
