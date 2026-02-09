import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { formatZodError } from '../../../../../core/validation.js';
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
  storeAdminIdParamSchema,
  storeAdminQuerySchema,
  loginStoreAdminSchema,
  registerFarmerSchema,
  daybookQuerySchema,
  gatePassNumberQuerySchema,
  farmerOrdersQuerySchema,
  farmerStorageLinkIdParamSchema,
  coldStorageAnalyticsQuerySchema,
  varietyInventoryAnalysisQuerySchema,
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
 * Login body validator
 */
export function createLoginBodyValidator(schema: typeof loginStoreAdminSchema) {
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
 * Register farmer body validator
 */
export function createRegisterFarmerBodyValidator(schema: typeof registerFarmerSchema) {
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
    const validated = storeAdminQuerySchema.parse(request.query);
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
 * Gate pass number query validator
 */
export function validateGatePassNumberQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = gatePassNumberQuerySchema.parse(request.query);
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
 * Farmer orders query validator
 */
export function validateFarmerOrdersQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = farmerOrdersQuerySchema.parse(request.query);
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
 * Farmer storage link ID param validator (/api/v1/store-admin/farmers/:id)
 */
export function validateFarmerStorageLinkIdParam(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = farmerStorageLinkIdParamSchema.parse(request.params);
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
 * Cold storage analytics query validator
 */
export function validateColdStorageAnalyticsQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = coldStorageAnalyticsQuerySchema.parse(request.query);
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
 * Variety inventory analysis query validator
 */
export function validateVarietyInventoryAnalysisQuery(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  try {
    const validated = varietyInventoryAnalysisQuerySchema.parse(request.query);
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
