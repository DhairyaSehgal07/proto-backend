import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { PreferencesController } from '../controllers/preferences.controller.js';
import {
  createPreferencesSchema,
  updatePreferencesSchema,
  CreatePreferencesInput,
  UpdatePreferencesInput,
  PreferencesIdParam,
  PreferencesQuery,
} from '../schemas/preferences-schema.js';
import {
  listOptions,
  getByIdOptions,
  createOptions,
  updateOptions,
  deleteOptions,
} from './options.js';
import { createBodyValidator, validateParams, validateQuery } from './validators.js';
import { authenticateAdmin } from '@/core/middleware/auth.middleware.js';

/**
 * Request/Response types for route handlers
 */
interface ListPreferencesRequestParams {
  Querystring: PreferencesQuery;
}

interface GetPreferencesRequestParams {
  Params: PreferencesIdParam;
}

interface CreatePreferencesRequestParams {
  Body: CreatePreferencesInput;
}

interface UpdatePreferencesRequestParams {
  Params: PreferencesIdParam;
  Body: UpdatePreferencesInput;
}

interface DeletePreferencesRequestParams {
  Params: PreferencesIdParam;
}

/**
 * Fastify route plugin for Preferences API
 * Registers all CRUD routes with validation
 */
function preferencesRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new PreferencesController(fastify);

  /**
   * GET /api/v1/preferences
   * Get all preferences with pagination and search
   */
  fastify.get(
    '/',
    {
      ...listOptions,
      preHandler: [validateQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAll(request as FastifyRequest<ListPreferencesRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/preferences/:id
   * Get a single preferences by ID
   */
  fastify.get(
    '/:id',
    {
      ...getByIdOptions,
      preHandler: [authenticateAdmin, validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getById(request as FastifyRequest<GetPreferencesRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/preferences
   * Create a new preferences
   */
  fastify.post(
    '/',
    {
      ...createOptions,
      preHandler: [createBodyValidator(createPreferencesSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreatePreferencesRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/preferences/:id
   * Update an existing preferences
   */
  fastify.put(
    '/:id',
    {
      ...updateOptions,
      preHandler: [validateParams, createBodyValidator(updatePreferencesSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.update(request as FastifyRequest<UpdatePreferencesRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/preferences/:id
   * Delete a preferences by ID
   */
  fastify.delete(
    '/:id',
    {
      ...deleteOptions,
      preHandler: [validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeletePreferencesRequestParams>, reply);
    }
  );
}

export default preferencesRoutes;
