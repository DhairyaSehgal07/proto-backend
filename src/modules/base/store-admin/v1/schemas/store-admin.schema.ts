import { z } from 'zod';

export const RoleEnum = z.enum(['Admin', 'Manager', 'Assistant']);
/**
 * CREATE StoreAdmin schema
 */
export const createStoreAdminSchema = z.object({
  coldStorageId: z.string().length(24, 'Invalid MongoDB ObjectId'),

  name: z.string().min(2, 'Name must be at least 2 characters long'),
  personalAddress: z.string().min(5, 'Address is required').optional(),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),

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
 */
export const loginStoreAdminSchema = z.object({
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
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
 * Type Inference (for controller/service layers)
 */
export type CreateStoreAdminInput = z.infer<typeof createStoreAdminSchema>;
export type UpdateStoreAdminInput = z.infer<typeof updateStoreAdminSchema>;
export type StoreAdminIdParam = z.infer<typeof storeAdminIdParamSchema>;
export type StoreAdminQuery = z.infer<typeof storeAdminQuerySchema>;
export type LoginStoreAdminInput = z.infer<typeof loginStoreAdminSchema>;
export type RegisterFarmerInput = z.infer<typeof registerFarmerSchema>;
