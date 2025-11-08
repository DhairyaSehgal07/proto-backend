import { z } from 'zod';
import { Commodity, GatePassType } from '../../../../../../generated/prisma/client.js';

/**
 * Commodity enum schema
 */
export const commodityEnum = z.nativeEnum(Commodity);

/**
 * GatePassType enum schema
 */
export const gatePassTypeEnum = z.nativeEnum(GatePassType);

/**
 * BagSize schema for incoming orders
 */
export const bagSizeSchema = z.object({
  name: z.string().min(1, 'Bag size name is required'),
  quantityInit: z.coerce.number().min(0, 'quantityInit must be non-negative'),
  quantityCurr: z.coerce.number().min(0, 'quantityCurr must be non-negative'),
  approxWeight: z.coerce.number().min(0, 'approxWeight must be non-negative').optional(),
  floor: z.string().min(1, 'Floor is required'),
  row: z.string().min(1, 'Row is required'),
  chamber: z.string().min(1, 'Chamber is required'),
});

/**
 * Variety schema for incoming orders
 */
export const varietySchema = z.object({
  name: z.string().min(1, 'Variety name is required'),
  bagSizes: z.array(bagSizeSchema).min(1, 'Each variety must have at least one bag size'),
});

/**
 * CREATE IncomingOrder schema
 */
export const createIncomingOrderSchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId'),
  commodity: commodityEnum,
  gatePassNumber: z.coerce.number().int().positive('Gate pass number must be a positive integer'),
  gatePassType: gatePassTypeEnum.optional().default(GatePassType.RECEIPT),
  remarks: z.string().optional(),
  currentStockAtThatTime: z.coerce.number().min(0, 'Current stock must be non-negative').optional(),
  varieties: z.array(varietySchema).optional(),
});

/**
 * UPDATE IncomingOrder schema
 */
export const updateIncomingOrderSchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId').optional(),
  commodity: commodityEnum.optional(),
  gatePassNumber: z.coerce
    .number()
    .int()
    .positive('Gate pass number must be a positive integer')
    .optional(),
  gatePassType: gatePassTypeEnum.optional(),
  remarks: z.string().optional(),
  currentStockAtThatTime: z.coerce.number().min(0, 'Current stock must be non-negative').optional(),
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
  commodity: commodityEnum.optional(),
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
  commodity: commodityEnum.optional(),
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
