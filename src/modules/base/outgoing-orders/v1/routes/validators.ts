import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  createOutgoingOrderSchema,
  updateOutgoingOrderSchema,
  outgoingOrderIdParamSchema,
  outgoingOrderQuerySchema,
  outgoingOrderFarmerQuerySchema,
} from '../schemas/outgoing-order-schema.js';

/**
 * Body validator factory (for create)
 */
export function createBodyValidator() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = createOutgoingOrderSchema.parse(request.body);
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
 * Body validator factory (for update)
 */
export function updateBodyValidator() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = updateOutgoingOrderSchema.parse(request.body);
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
 * Params validator (/api/v1/outgoing-orders/:id)
 */
export function validateParams(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = outgoingOrderIdParamSchema.parse(request.params);
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
 * Query validator (/api/v1/outgoing-orders?page=1&limit=10)
 */
export function validateQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = outgoingOrderQuerySchema.parse(request.query);
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
 * Farmer query validator (/api/v1/outgoing-orders/farmer?farmerStorageLinkId=...)
 */
export function validateFarmerQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = outgoingOrderFarmerQuerySchema.parse(request.query);
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
