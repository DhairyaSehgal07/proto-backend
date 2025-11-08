import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ColdStorageController } from '../controllers/cold-storage.controller.js';
import {
  createColdStorageSchema,
  updateColdStorageSchema,
  CreateColdStorageInput,
  UpdateColdStorageInput,
  ColdStorageIdParam,
  ColdStorageQuery,
} from '../schemas/cold-storage-schema.js';
import {
  listOptions,
  getByIdOptions,
  createOptions,
  updateOptions,
  deleteOptions,
} from './options.js';
import { createBodyValidator, validateParams, validateQuery } from './validators.js';

/**
 * Request/Response types for route handlers
 */
interface ListColdStorageRequestParams {
  Querystring: ColdStorageQuery;
}

interface GetColdStorageRequestParams {
  Params: ColdStorageIdParam;
}

interface CreateColdStorageRequestParams {
  Body: CreateColdStorageInput;
}

interface UpdateColdStorageRequestParams {
  Params: ColdStorageIdParam;
  Body: UpdateColdStorageInput;
}

interface DeleteColdStorageRequestParams {
  Params: ColdStorageIdParam;
}

/**
 * Fastify route plugin for Cold Storage API
 * Registers all CRUD routes with validation
 */
function coldStorageRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new ColdStorageController(fastify);

  /**
   * GET /api/v1/cold-storage
   * Get all cold storages with pagination and search
   */
  fastify.get(
    '/',
    {
      ...listOptions,
      preHandler: [validateQuery],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAll(request as FastifyRequest<ListColdStorageRequestParams>, reply);
    }
  );

  /**
   * GET /api/v1/cold-storage/:id
   * Get a single cold storage by ID
   */
  fastify.get(
    '/:id',
    {
      ...getByIdOptions,
      preHandler: [validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getById(request as FastifyRequest<GetColdStorageRequestParams>, reply);
    }
  );

  /**
   * POST /api/v1/cold-storage
   * Create a new cold storage
   */
  fastify.post(
    '/',
    {
      ...createOptions,
      preHandler: [createBodyValidator(createColdStorageSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request as FastifyRequest<CreateColdStorageRequestParams>, reply);
    }
  );

  /**
   * PUT /api/v1/cold-storage/:id
   * Update an existing cold storage
   */
  fastify.put(
    '/:id',
    {
      ...updateOptions,
      preHandler: [validateParams, createBodyValidator(updateColdStorageSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.update(request as FastifyRequest<UpdateColdStorageRequestParams>, reply);
    }
  );

  /**
   * DELETE /api/v1/cold-storage/:id
   * Delete a cold storage by ID
   */
  fastify.delete(
    '/:id',
    {
      ...deleteOptions,
      preHandler: [validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.delete(request as FastifyRequest<DeleteColdStorageRequestParams>, reply);
    }
  );
}

export default coldStorageRoutes;
