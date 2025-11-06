import { z } from 'zod';

/**
 * Enum for plan type — must match your Prisma enum
 */
export const PlanEnum = z.enum(['Basic', 'Pro', 'Enterprise']);

/**
 * CREATE schema
 */
export const createColdStorageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  address: z.string().min(5, 'Address is required'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  capacity: z.number().positive('Capacity must be a positive number'),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  isPaid: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  plan: PlanEnum.optional().default('Basic'),
});

/**
 * UPDATE schema (partial)
 */
export const updateColdStorageSchema = createColdStorageSchema.partial();

/**
 * PARAM schema for routes like /:id
 */
export const coldStorageIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * QUERY schema (for filters, pagination, search)
 */
export const coldStorageQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  plan: PlanEnum.optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * Infer types for controller/service usage
 */
export type CreateColdStorageInput = z.infer<typeof createColdStorageSchema>;
export type UpdateColdStorageInput = z.infer<typeof updateColdStorageSchema>;
export type ColdStorageIdParam = z.infer<typeof coldStorageIdParamSchema>;
export type ColdStorageQuery = z.infer<typeof coldStorageQuerySchema>;
