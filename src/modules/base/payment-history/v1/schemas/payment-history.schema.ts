import { z } from 'zod';

export const PaymentTypeEnum = z.enum(['RENT', 'PAYMENT', 'EXPENSE']);

/**
 * CREATE PaymentHistory schema
 */
export const createPaymentHistorySchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId'),
  date: z.coerce.date(),
  amount: z.number().positive('Amount must be positive'),
  type: PaymentTypeEnum,
  remarks: z.string().optional(),
  createdBy: z.string().length(24, 'Invalid MongoDB ObjectId').optional().nullable(),
  voucherId: z.string().length(24, 'Invalid MongoDB ObjectId').optional().nullable(),
});

/**
 * UPDATE PaymentHistory schema
 */
export const updatePaymentHistorySchema = z.object({
  date: z.coerce.date().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  type: PaymentTypeEnum.optional(),
  remarks: z.string().optional(),
  voucherId: z.string().length(24, 'Invalid MongoDB ObjectId').optional().nullable(),
});

/**
 * PARAM schema — used for routes like /:id
 */
export const paymentHistoryIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

/**
 * QUERY schema — for listing, search, filters
 */
export const paymentHistoryQuerySchema = z.object({
  farmerStorageLinkId: z.string().length(24, 'Invalid MongoDB ObjectId').optional(),
  type: PaymentTypeEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * Type exports for use in routes and controllers
 */
export type CreatePaymentHistoryInput = z.infer<typeof createPaymentHistorySchema>;
export type UpdatePaymentHistoryInput = z.infer<typeof updatePaymentHistorySchema>;
export type PaymentHistoryIdParam = z.infer<typeof paymentHistoryIdParamSchema>;
export type PaymentHistoryQuery = z.infer<typeof paymentHistoryQuerySchema>;
