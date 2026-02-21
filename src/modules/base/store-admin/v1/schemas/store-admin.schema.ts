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
  password: z.string().min(6, 'Password must be at least 6 characters long'),

  role: RoleEnum.optional().default('Manager'),
  isVerified: z.boolean().optional().default(true),
});

/**
 * UPDATE StoreAdmin schema
 * Supports mobile numbers with or without country code for backward compatibility
 */
export const updateStoreAdminSchema = createStoreAdminSchema.partial().extend({
  mobileNumber: z
    .string()
    .refine(
      (val) => /^\+[1-9]\d{1,3}\d{7,15}$/.test(val) || /^[0-9]{10}$/.test(val),
      'Mobile number must be either +[country code][number] (e.g., +919876543210) or 10 digits (e.g., 9876543210)'
    )
    .optional(),
});

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
  dateFrom: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)')
    .optional()
    .describe('Start date for filtering orders (inclusive)'),
  dateTo: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format (e.g., 2024-12-31T23:59:59Z)')
    .optional()
    .describe('End date for filtering orders (inclusive)'),
});

/**
 * GATE PASS NUMBER QUERY schema — for getting next gate pass number
 */

export const gatePassNumberQuerySchema = z.object({
  commodity: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;

      const normalized = val.toUpperCase();
      const allowed = ['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'];

      return {
        original: normalized,
        normalized: allowed.includes(normalized) ? normalized : 'OTHER',
      };
    },
    z.object({
      original: z.string(),
      normalized: z.enum([
        'POTATO',
        'ONION',
        'GARLIC',
        'TOMATO',
        'CARROT',
        'APPLE',
        'SWEETS',
        'OTHER',
      ]),
    })
  ),
  type: z.enum(['incoming', 'outgoing']),
});

/**
 * FARMER ORDERS QUERY schema — for getting all orders of a farmer
 */
export const farmerOrdersQuerySchema = z.object({
  farmerStorageLinkId: z
    .string()
    .length(24, 'Invalid MongoDB ObjectId')
    .describe('Farmer storage link ID to get orders for'),
  type: z
    .enum(['all', 'incoming', 'outgoing'])
    .optional()
    .default('all')
    .describe('Filter by order type: all, incoming, or outgoing'),
});

/**
 * FARMER STORAGE LINK ID PARAM schema — for getting farmer by farmerStorageLinkId
 */
export const farmerStorageLinkIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * COLD STORAGE ANALYTICS QUERY schema — for analytics overview endpoint
 */
export const coldStorageAnalyticsQuerySchema = z.object({
  coldStorageId: z
    .string()
    .length(24, 'Invalid MongoDB ObjectId')
    .describe('Cold storage ID (required)'),
  dateFrom: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)')
    .optional()
    .describe('Start date for filtering (ISO 8601 format)'),
  dateTo: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format (e.g., 2024-12-31T23:59:59Z)')
    .optional()
    .describe('End date for filtering (ISO 8601 format)'),
  commodity: z
    .enum(['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'])
    .optional()
    .describe('Filter by commodity type'),
  farmerId: z
    .string()
    .length(24, 'Invalid MongoDB ObjectId')
    .optional()
    .describe('Filter by farmer storage link ID'),
  locationId: z
    .string()
    .length(24, 'Invalid MongoDB ObjectId')
    .optional()
    .describe('Filter by location ID'),
});

/**
 * VARIETY INVENTORY ANALYSIS QUERY schema — for variety-wise inventory analysis
 */
export const varietyInventoryAnalysisQuerySchema = z.object({
  storageId: z
    .string()
    .length(24, 'Invalid MongoDB ObjectId')
    .describe('Cold storage ID (required)'),
  commodity: z
    .enum(['POTATO', 'ONION', 'GARLIC', 'TOMATO', 'CARROT', 'APPLE', 'SWEETS', 'OTHER'])
    .describe('Commodity type (required)'),
  variety: z.string().min(1, 'Variety name is required').describe('Variety name (required)'),
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
export type FarmerOrdersQuery = z.infer<typeof farmerOrdersQuerySchema>;
export type FarmerStorageLinkIdParam = z.infer<typeof farmerStorageLinkIdParamSchema>;
export type ColdStorageAnalyticsQuery = z.infer<typeof coldStorageAnalyticsQuerySchema>;
export type VarietyInventoryAnalysisQuery = z.infer<typeof varietyInventoryAnalysisQuerySchema>;
