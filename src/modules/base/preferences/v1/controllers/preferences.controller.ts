import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  PreferencesService,
  PreferencesNotFoundError,
  PreferencesValidationError,
} from '../services/preferences.service.js';

import type { CreatePreferencesRequest, UpdatePreferencesRequest } from '../types/preferences.js';

import type {
  PreferencesIdParam,
  PreferencesQuery,
  CreatePreferencesInput,
  UpdatePreferencesInput,
} from '../schemas/preferences-schema.js';

// Route-level types
interface CreatePreferencesRequestParams {
  Body: CreatePreferencesInput;
}

interface UpdatePreferencesRequestParams {
  Params: PreferencesIdParam;
  Body: UpdatePreferencesInput;
}

interface GetPreferencesRequestParams {
  Params: PreferencesIdParam;
}

interface DeletePreferencesRequestParams {
  Params: PreferencesIdParam;
}

interface ListPreferencesRequestParams {
  Querystring: PreferencesQuery;
}

/**
 * Controller for Preferences endpoints
 */
export class PreferencesController {
  private readonly service: PreferencesService;

  constructor(fastify: FastifyInstance) {
    this.service = new PreferencesService(fastify);
  }

  /**
   * GET /preferences - List all preferences (with pagination & search)
   */
  async getAll(
    request: FastifyRequest<ListPreferencesRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { page, limit, search } = request.query;

      const result = await this.service.getAll({
        page,
        limit,
        search,
      });

      await reply.code(200).send({
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
      await this.handleError(error, reply);
    }
  }

  /**
   * GET /preferences/:id - Get one preferences
   */
  async getById(
    request: FastifyRequest<GetPreferencesRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      request.log.info(`Controller: Getting preferences with id: ${id}`);
      const preferences = await this.service.getById(id);
      request.log.info(`Controller: Preferences retrieved successfully for id: ${id}`);

      await reply.code(200).send({
        success: true,
        data: preferences,
      });
    } catch (error) {
      await this.handleError(error, reply);
    }
  }

  /**
   * POST /preferences - Create new preferences
   */
  async create(
    request: FastifyRequest<CreatePreferencesRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const preferences = await this.service.create(request.body as CreatePreferencesRequest);

      await reply.code(201).send({
        success: true,
        data: preferences,
        message: 'Preferences created successfully',
      });
    } catch (error) {
      await this.handleError(error, reply);
    }
  }

  /**
   * PUT /preferences/:id - Update existing preferences
   */
  async update(
    request: FastifyRequest<UpdatePreferencesRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const updated = await this.service.update(id, request.body as UpdatePreferencesRequest);

      await reply.code(200).send({
        success: true,
        data: updated,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      await this.handleError(error, reply);
    }
  }

  /**
   * DELETE /preferences/:id - Delete preferences
   */
  async delete(
    request: FastifyRequest<DeletePreferencesRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      await this.service.delete(id);

      await reply.code(200).send({
        success: true,
        message: 'Preferences deleted successfully',
      });
    } catch (error) {
      await this.handleError(error, reply);
    }
  }

  /**
   * Centralized error handler
   */
  private async handleError(error: unknown, reply: FastifyReply): Promise<void> {
    if (error instanceof Error) reply.log.error(error);

    if (error instanceof PreferencesNotFoundError) {
      await reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }

    if (error instanceof PreferencesValidationError) {
      await reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
      return;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2025') {
        await reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Preferences not found' },
        });
        return;
      }
      if (prismaError.code === 'P2002') {
        await reply.code(409).send({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' },
        });
        return;
      }
    }

    await reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected error occurred',
      },
    });
  }
}
