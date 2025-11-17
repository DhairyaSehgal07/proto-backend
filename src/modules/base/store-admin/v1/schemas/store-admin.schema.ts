import { z } from 'zod';

export const RoleEnum = z.enum(['Admin', 'Manager', 'Assistant']);
/**
 * CREATE StoreAdmin schema
 */
export const createStoreAdminSchema = z.object({
  coldStorageId: z.string().length(24, 'Invalid MongoDB ObjectId'),

  name: z.string().min(2, 'Name must be at least 2 characters long'),
  personalAddress: z.string().min(5, 'Address is required').optional(),
  mobileNumber: z
    .string()
    .regex(
      /^\+[1-9]\d{1,3}\d{7,15}$/,
      'Mobile number must include country code (e.g., +919876543210)'
    ),
  password: z.string().min(8, 'Password must be at least 8 characters long'),

  role: RoleEnum.optional().default('Manager'),
  isVerified: z.boolean().optional().default(true),
});

/**
 * UPDATE StoreAdmin schema
 */
export const updateStoreAdminSchema = createStoreAdminSchema.partial();

/**
 * PARAM schema — used for routes like /:id
 */
export const storeAdminIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * QUERY schema — for listing, search, filters
 */
export const storeAdminQuerySchema = z.object({
  coldStorageId: z.string().length(24, 'Invalid MongoDB ObjectId').optional(),
  search: z.string().optional(),
  role: RoleEnum.optional(),
  isVerified: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * LOGIN schema
 * Supports both formats for backward compatibility:
 * - New format: +[country code][number] (e.g., +919876543210)
 * - Old format: 10 digits (e.g., 9876543210)
 */
export const loginStoreAdminSchema = z.object({
  mobileNumber: z
    .string()
    .refine(
      (val) => /^\+[1-9]\d{1,3}\d{7,15}$/.test(val) || /^[0-9]{10}$/.test(val),
      'Mobile number must be either +[country code][number] (e.g., +919876543210) or 10 digits (e.g., 9876543210)'
    ),
  password: z.string().min(1, 'Password is required'),
  isMobile: z.boolean().optional().default(false),
});

/**
 * REGISTER FARMER schema
 */
export const registerFarmerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  imageUrl: z.union([z.string().url('Invalid image URL'), z.literal('')]).optional(),
  accountNumber: z.coerce
    .number('Account number must be a number')
    .int('Account number must be an integer')
    .positive('Account number must be positive')
    .min(1, 'Account number must be at least 1'),
  notes: z.string().optional(),
});

/**
 * DAYBOOK QUERY schema — for daybook route
 */
export const daybookQuerySchema = z.object({
  type: z.enum(['all', 'incoming', 'outgoing']).optional().default('all'),
  commodity: z
    .enum(['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'])
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(['latest', 'oldest']).optional().default('latest'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * GATE PASS NUMBER QUERY schema — for getting next gate pass number
 */
export const gatePassNumberQuerySchema = z.object({
  commodity: z
    .enum(['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'])
    .describe('Commodity type to get the next gate pass number for'),
  type: z
    .enum(['incoming', 'outgoing'])
    .describe('Order type - determines which model to query (incoming or outgoing orders)'),
});

/**
 * Type Inference (for controller/service layers)
 */
export type CreateStoreAdminInput = z.infer<typeof createStoreAdminSchema>;
export type UpdateStoreAdminInput = z.infer<typeof updateStoreAdminSchema>;
export type StoreAdminIdParam = z.infer<typeof storeAdminIdParamSchema>;
export type StoreAdminQuery = z.infer<typeof storeAdminQuerySchema>;
export type LoginStoreAdminInput = z.infer<typeof loginStoreAdminSchema>;
export type RegisterFarmerInput = z.infer<typeof registerFarmerSchema>;
export type DaybookQuery = z.infer<typeof daybookQuerySchema>;
export type GatePassNumberQuery = z.infer<typeof gatePassNumberQuerySchema>;
