import { z } from 'zod';

/**
 * Commodity object schema
 */
export const commodityObjSchema = z.object({
  name: z.string().min(1, 'Commodity name is required'),
  varieties: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
});

/**
 * Incoming preferences schema
 */
export const incomingPrefsSchema = z.object({
  showCustomMarka: z.boolean().default(false),
});

/**
 * CREATE schema
 */
export const createPreferencesSchema = z.object({
  commodities: z.array(commodityObjSchema).default([]).optional(),
  generation: z.string().nullable().optional(),
  rouging: z.string().nullable().optional(),
  tuberType: z.string().nullable().optional(),
  grader: z.string().nullable().optional(),
  incoming: incomingPrefsSchema.optional(),
  customFields: z.record(z.string(), z.any()).nullable().optional(),
});

/**
 * UPDATE schema (partial)
 */
export const updatePreferencesSchema = createPreferencesSchema.partial();

/**
 * PARAM schema for routes like /:id
 */
export const preferencesIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * QUERY schema (for filters, pagination, search)
 */
export const preferencesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * Infer types for controller/service usage
 */
export type CreatePreferencesInput = z.infer<typeof createPreferencesSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type PreferencesIdParam = z.infer<typeof preferencesIdParamSchema>;
export type PreferencesQuery = z.infer<typeof preferencesQuerySchema>;
