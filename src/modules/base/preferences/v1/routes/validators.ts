import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  createPreferencesSchema,
  updatePreferencesSchema,
  preferencesIdParamSchema,
  preferencesQuerySchema,
} from '../schemas/preferences-schema.js';

/**
 * Pre-handler factory to validate request body with Zod
 */
export function createBodyValidator(
  schema: typeof createPreferencesSchema | typeof updatePreferencesSchema
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
 * Pre-handler to validate route parameters with Zod
 */
export function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = preferencesIdParamSchema.parse(request.params);
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
 * Pre-handler to validate query parameters with Zod
 */
export function validateQuery(request: FastifyRequest, reply: FastifyReply): void {
  try {
    const validated = preferencesQuerySchema.parse(request.query);
    request.query = validated;
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
