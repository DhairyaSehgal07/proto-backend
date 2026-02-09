import { z } from 'zod';
import { GatePassType } from '../../../../../../generated/prisma/client.js';

/**
 * Commodity: free string (enum-free), e.g. POTATO, FRUIT, OTHER, or any custom name
 */
export const commoditySchema = z.string().min(1, 'Commodity is required');

/**
 * GatePassType enum schema
 */
export const gatePassTypeEnum = z.nativeEnum(GatePassType);

/** User-friendly message when location (floor/row/chamber) is missing for a bag size */
const LOCATION_REQUIRED_MSG =
  'Location is required: please select Floor, Row and Chamber for each bag size';

/** Coerce null/undefined to empty string so .min(1) yields a clear message instead of "Invalid type" */
const locationString = z.preprocess(
  (val) => (val === null || val === undefined ? '' : val),
  z.string().min(1, LOCATION_REQUIRED_MSG)
);

/**
 * BagSize schema for incoming orders
 */
export const bagSizeSchema = z.object({
  name: z.string().min(1, 'Bag size name is required'),
  quantityInit: z.coerce.number().min(0, 'Quantity must be non-negative'),
  quantityCurr: z.coerce.number().min(0, 'Quantity must be non-negative'),
  approxWeight: z.coerce.number().min(0, 'Approx weight must be non-negative').optional(),
  customMarka: z.string().optional(),
  floor: locationString,
  row: locationString,
  chamber: locationString,
  pricePerBag: z.coerce.number().min(0, 'Price per bag must be non-negative').optional(),
});

/**
 * Variety schema for incoming orders
 */
export const varietySchema = z.object({
  name: z.string().min(1, 'Variety name is required'),
  bagSizes: z
    .array(bagSizeSchema)
    .min(1, 'Each variety must have at least one bag size with quantity and location'),
});

/**
 * CREATE IncomingOrder schema
 * Note: varieties can be undefined, null, or empty array for null vouchers
 */
const FARMER_REQUIRED_MSG = 'Farmer is required. Please select a farmer.';

export const createIncomingOrderSchema = z.object({
  farmerStorageLinkId: z.preprocess(
    (val) => (val === null || val === undefined ? '' : val),
    z.string().min(1, FARMER_REQUIRED_MSG).length(24, FARMER_REQUIRED_MSG)
  ),
  commodity: commoditySchema,
  gatePassNumber: z.coerce.number().int().positive('Gate pass number must be a positive integer'),
  gatePassType: gatePassTypeEnum.optional().default(GatePassType.RECEIPT),
  date: z.coerce.date().optional(),
  remarks: z.string().nullable().optional(),
  currentStockAtThatTime: z.coerce.number().min(0, 'Current stock must be non-negative').optional(),
  storeCharge: z.coerce.number().min(0, 'Store charge must be non-negative').optional(),
  varieties: z
    .union([
      z.array(varietySchema).min(1, 'Please add at least one variety with bag sizes and locations'),
      z.array(varietySchema).length(0),
      z.null(),
    ])
    .optional(),
});

/**
 * UPDATE IncomingOrder schema
 */
export const updateIncomingOrderSchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId').optional(),
  commodity: commoditySchema.optional(),
  gatePassNumber: z.coerce
    .number()
    .int()
    .positive('Gate pass number must be a positive integer')
    .optional(),
  gatePassType: gatePassTypeEnum.optional(),
  date: z.coerce.date().optional(),
  remarks: z.string().nullable().optional(),
  currentStockAtThatTime: z.coerce.number().min(0, 'Current stock must be non-negative').optional(),
  storeCharge: z.coerce.number().min(0, 'Store charge must be non-negative').optional(),
  varieties: z.array(varietySchema).optional(),
});

/**
 * PARAM schema — used for routes like /:id
 */
export const incomingOrderIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * QUERY schema — for listing, search, filters (cold storage orders)
 */
export const incomingOrderQuerySchema = z.object({
  commodity: commoditySchema.optional(),
  gatePassType: gatePassTypeEnum.optional(),
  search: z.string().optional(), // Search by gate pass number
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * QUERY schema — for getting orders by farmer
 */
export const incomingOrderFarmerQuerySchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId'),
  commodity: commoditySchema.optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * Type Inference (for controller/service layers)
 */
export type CreateIncomingOrderInput = z.infer<typeof createIncomingOrderSchema>;
export type UpdateIncomingOrderInput = z.infer<typeof updateIncomingOrderSchema>;
export type IncomingOrderIdParam = z.infer<typeof incomingOrderIdParamSchema>;
export type IncomingOrderQuery = z.infer<typeof incomingOrderQuerySchema>;
export type IncomingOrderFarmerQuery = z.infer<typeof incomingOrderFarmerQuerySchema>;
