import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { formatZodError } from '../../../../../core/validation.js';
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
        const { message, details } = formatZodError(error);
        reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
            details,
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
      const { message, details } = formatZodError(error);
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          details,
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
      const { message, details } = formatZodError(error);
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          details,
        },
      });
      return;
    }
    throw error;
  }
}
