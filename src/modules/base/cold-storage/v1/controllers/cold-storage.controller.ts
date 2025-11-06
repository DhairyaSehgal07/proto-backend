import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  ColdStorageService,
  ColdStorageNotFoundError,
  ColdStorageValidationError,
} from '../services/cold-storage.service.js';

import type { CreateColdStorageRequest, UpdateColdStorageRequest } from '../types/cold-storage.js';

import type { ColdStorageIdParam, ColdStorageQuery } from '../schemas/cold-storage-schema.js';

// Route-level types
interface CreateColdStorageRequestParams {
  Body: CreateColdStorageRequest;
}

interface UpdateColdStorageRequestParams {
  Params: ColdStorageIdParam;
  Body: UpdateColdStorageRequest;
}

interface GetColdStorageRequestParams {
  Params: ColdStorageIdParam;
}

interface DeleteColdStorageRequestParams {
  Params: ColdStorageIdParam;
}

interface ListColdStorageRequestParams {
  Querystring: ColdStorageQuery;
}

/**
 * Controller for ColdStorage endpoints
 */
export class ColdStorageController {
  private readonly service: ColdStorageService;

  constructor(fastify: FastifyInstance) {
    this.service = new ColdStorageService(fastify);
  }

  /**
   * GET /cold-storage - List all cold storages (with pagination & search)
   */
  async getAll(
    request: FastifyRequest<ListColdStorageRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { page, limit, search, isActive, plan } = request.query;

      // Convert isActive string to boolean if provided
      const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

      const result = await this.service.getAll({
        page,
        limit,
        search,
        isActive: isActiveBool,
        plan,
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
   * GET /cold-storage/:id - Get one cold storage
   */
  async getById(
    request: FastifyRequest<GetColdStorageRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const storage = await this.service.getById(id);

      reply.code(200).send({
        success: true,
        data: storage,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * POST /cold-storage - Create new cold storage
   */
  async create(
    request: FastifyRequest<CreateColdStorageRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storage = await this.service.create(request.body);

      reply.code(201).send({
        success: true,
        data: storage,
        message: 'Cold storage created successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * PUT /cold-storage/:id - Update existing cold storage
   */
  async update(
    request: FastifyRequest<UpdateColdStorageRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const updated = await this.service.update(id, request.body);

      reply.code(200).send({
        success: true,
        data: updated,
        message: 'Cold storage updated successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * DELETE /cold-storage/:id - Delete cold storage
   */
  async delete(
    request: FastifyRequest<DeleteColdStorageRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      await this.service.delete(id);

      reply.code(200).send({
        success: true,
        message: 'Cold storage deleted successfully',
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

    if (error instanceof ColdStorageNotFoundError) {
      reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }

    if (error instanceof ColdStorageValidationError) {
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
          error: { code: 'NOT_FOUND', message: 'Cold storage not found' },
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
