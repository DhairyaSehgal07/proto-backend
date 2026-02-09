import { ZodError } from 'zod';

export interface ValidationDetail {
  path: string;
  message: string;
}

/**
 * Format a ZodError into a user-facing message and details array.
 * The message is the first issue as "path: message" (e.g. "storeCharge: Store charge must be non-negative")
 * so clients see the actual validation error instead of generic "Request validation failed".
 */
export function formatZodError(error: ZodError): { message: string; details: ValidationDetail[] } {
  const details: ValidationDetail[] = error.issues.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
  const first = details[0];
  const message = first
    ? first.path
      ? `${first.path}: ${first.message}`
      : first.message
    : 'Validation failed';
  return { message, details };
}

/** Fastify/Ajv validation error item (instancePath may be e.g. "/body/commodity") */
interface FastifyValidationItem {
  instancePath?: string;
  message?: string;
  params?: Record<string, unknown>;
}

/**
 * Format Fastify schema validation errors into a user-facing message and details array.
 * Uses the first validation item; path is derived from instancePath (e.g. "/body/commodity" -> "body.commodity").
 */
export function formatFastifyValidation(validation: FastifyValidationItem[]): {
  message: string;
  details: ValidationDetail[];
} {
  const details: ValidationDetail[] = (validation || []).map((e) => {
    const path = (e.instancePath || '').replace(/^\//, '').replace(/\//g, '.').trim();
    return {
      path: path || ((e.params as { missingProperty?: string })?.missingProperty ?? ''),
      message: e.message || 'Invalid value',
    };
  });
  const first = details[0];
  const message = first
    ? first.path
      ? `${first.path}: ${first.message}`
      : first.message
    : 'Validation failed';
  return { message, details };
}
