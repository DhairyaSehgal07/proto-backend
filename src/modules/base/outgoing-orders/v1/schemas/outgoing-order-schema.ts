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
 * BagSizeSnapshot schema for outgoing orders
 */
export const bagSizeSnapshotSchema = z
  .object({
    name: z.string().min(1, 'Bag size name is required'),
    locationId: z.string().length(24, 'Invalid MongoDB ObjectId'),
    incomingOrderId: z.string().length(24, 'Invalid MongoDB ObjectId'),
    varietyName: z.string().min(1, 'Variety name is required'),
    quantityBefore: z.coerce.number().min(0, 'quantityBefore must be non-negative'),
    quantityRemoved: z.coerce.number().positive('quantityRemoved must be positive'),
    quantityAfter: z.coerce.number().min(0, 'quantityAfter must be non-negative'),
    approxWeight: z.coerce.number().min(0, 'approxWeight must be non-negative').optional(),
  })
  .refine((data) => data.quantityAfter === data.quantityBefore - data.quantityRemoved, {
    message: 'quantityAfter must equal quantityBefore - quantityRemoved',
    path: ['quantityAfter'],
  })
  .refine((data) => data.quantityRemoved <= data.quantityBefore, {
    message: 'quantityRemoved cannot exceed quantityBefore',
    path: ['quantityRemoved'],
  });

/**
 * VarietySnapshot schema for outgoing orders
 */
export const varietySnapshotSchema = z.object({
  name: z.string().min(1, 'Variety name is required'),
  bagSizes: z.array(bagSizeSnapshotSchema).min(1, 'Each variety must have at least one bag size'),
});

/**
 * CREATE OutgoingOrder schema
 */
export const createOutgoingOrderSchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId'),
  commodity: commodityEnum,
  gatePassNumber: z.coerce.number().int().positive('Gate pass number must be a positive integer'),
  gatePassType: gatePassTypeEnum.optional().default(GatePassType.DELIVERY),
  date: z.coerce.date().optional(),
  remarks: z.string().optional().nullable(),
  currentStockAtThatTime: z.coerce.number().min(0, 'Current stock must be non-negative').optional(),
  varieties: z.array(varietySnapshotSchema).optional(),
});

/**
 * UPDATE OutgoingOrder schema
 */
export const updateOutgoingOrderSchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId').optional(),
  commodity: commodityEnum.optional(),
  gatePassNumber: z.coerce
    .number()
    .int()
    .positive('Gate pass number must be a positive integer')
    .optional(),
  gatePassType: gatePassTypeEnum.optional(),
  date: z.coerce.date().optional(),
  remarks: z.string().optional(),
  currentStockAtThatTime: z.coerce.number().min(0, 'Current stock must be non-negative').optional(),
  varieties: z.array(varietySnapshotSchema).optional(),
});

/**
 * PARAM schema — used for routes like /:id
 */
export const outgoingOrderIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * QUERY schema — for listing, search, filters (cold storage orders)
 */
export const outgoingOrderQuerySchema = z.object({
  commodity: commodityEnum.optional(),
  gatePassType: gatePassTypeEnum.optional(),
  search: z.string().optional(), // Search by gate pass number
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * QUERY schema — for getting orders by farmer
 */
export const outgoingOrderFarmerQuerySchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId'),
  commodity: commodityEnum.optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * Type Inference (for controller/service layers)
 */
export type CreateOutgoingOrderInput = z.infer<typeof createOutgoingOrderSchema>;
export type UpdateOutgoingOrderInput = z.infer<typeof updateOutgoingOrderSchema>;
export type OutgoingOrderIdParam = z.infer<typeof outgoingOrderIdParamSchema>;
export type OutgoingOrderQuery = z.infer<typeof outgoingOrderQuerySchema>;
export type OutgoingOrderFarmerQuery = z.infer<typeof outgoingOrderFarmerQuerySchema>;
