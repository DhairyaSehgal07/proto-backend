import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
  storeAdminIdParamSchema,
  storeAdminQuerySchema,
  loginStoreAdminSchema,
  registerFarmerSchema,
  daybookQuerySchema,
} from '../schemas/store-admin.schema.js';

/**
 * Body validator factory (for create/update)
 */
export function createBodyValidator(
  schema: typeof createStoreAdminSchema | typeof updateStoreAdminSchema
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      throw error;
    }
  };
}

/**
 * Login body validator
 */
export function createLoginBodyValidator(schema: typeof loginStoreAdminSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      throw error;
    }
  };
}

/**
 * Register farmer body validator
 */
export function createRegisterFarmerBodyValidator(schema: typeof registerFarmerSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      throw error;
    }
  };
}

/**
 * Params validator (/api/v1/store-admin/:id)
 */
export function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = storeAdminIdParamSchema.parse(request.params);
    request.params = validated;
    done();
  } catch (error) {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid route parameters',
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    throw error;
  }
}

/**
 * Query validator (for list/search)
 */
export function validateQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = storeAdminQuerySchema.parse(request.query);
    request.query = validated;
    done();
  } catch (error) {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    throw error;
  }
}

/**
 * Daybook query validator
 */
export function validateDaybookQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = daybookQuerySchema.parse(request.query);
    request.query = validated;
    done();
  } catch (error) {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    throw error;
  }
}
