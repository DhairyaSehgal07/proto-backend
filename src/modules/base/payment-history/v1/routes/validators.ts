import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { formatZodError } from '../../../../../core/validation.js';
import {
  createPaymentHistorySchema,
  updatePaymentHistorySchema,
  paymentHistoryIdParamSchema,
  paymentHistoryQuerySchema,
} from '../schemas/payment-history.schema.js';

/**
 * Body validator factory (for create)
 */
export function createBodyValidator(schema: typeof createPaymentHistorySchema) {
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
 * Body validator factory (for update)
 */
export function updateBodyValidator(schema: typeof updatePaymentHistorySchema) {
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
 * Params validator (/api/v1/payment-history/:id)
 */
export function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = paymentHistoryIdParamSchema.parse(request.params);
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
 * Query validator (for list/search)
 */
export function validateQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = paymentHistoryQuerySchema.parse(request.query);
    request.query = validated;
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
