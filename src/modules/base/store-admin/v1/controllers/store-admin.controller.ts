import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  StoreAdminService,
  StoreAdminNotFoundError,
  StoreAdminValidationError,
} from '../services/store-admin.service.js';

import type { CreateStoreAdminRequest, UpdateStoreAdminRequest } from '../types/store-admin.js';

import type {
  StoreAdminIdParam,
  StoreAdminQuery,
  CreateStoreAdminInput,
  UpdateStoreAdminInput,
} from '../schemas/store-admin.schema.js';

// Route-level types
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

/**
 * Controller for StoreAdmin endpoints
 */
export class StoreAdminController {
  private readonly service: StoreAdminService;

  constructor(fastify: FastifyInstance) {
    this.service = new StoreAdminService(fastify);
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
