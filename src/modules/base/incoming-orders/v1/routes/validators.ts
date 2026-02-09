import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { formatZodError } from '../../../../../core/validation.js';
import {
  createIncomingOrderSchema,
  updateIncomingOrderSchema,
  incomingOrderIdParamSchema,
  incomingOrderQuerySchema,
  incomingOrderFarmerQuerySchema,
} from '../schemas/incoming-order-schema.js';

/**
 * Body validator factory (for create)
 */
export function createBodyValidator() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = createIncomingOrderSchema.parse(request.body);
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
export function updateBodyValidator() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = updateIncomingOrderSchema.parse(request.body);
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
 * Params validator (/api/v1/incoming-orders/:id)
 */
export function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = incomingOrderIdParamSchema.parse(request.params);
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
    const validated = incomingOrderQuerySchema.parse(request.query);
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

/**
 * Query validator (for farmer orders)
 */
export function validateFarmerQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = incomingOrderFarmerQuerySchema.parse(request.query);
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
