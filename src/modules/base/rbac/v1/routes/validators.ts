import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  createOrUpdateRolePermissionSchema,
  roleParamSchema,
  coldStorageIdParamSchema,
} from '../schemas/rbac.schema.js';

/**
 * Body validator factory
 */
export function createBodyValidator(schema: typeof createOrUpdateRolePermissionSchema) {
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
 * Params validator
 */
export function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const params = request.params as Record<string, string>;

    // Validate coldStorageId if present
    if (params.coldStorageId) {
      coldStorageIdParamSchema
        .pick({ coldStorageId: true })
        .parse({ coldStorageId: params.coldStorageId });
    }

    // Validate role if present
    if (params.role) {
      roleParamSchema.pick({ role: true }).parse({ role: params.role });
    }

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
