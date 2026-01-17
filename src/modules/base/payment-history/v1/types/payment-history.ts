import type { FarmerPaymentHistoryModel } from '../../../../../../generated/prisma/models/FarmerPaymentHistory.js';

/**
 * Complete FarmerPaymentHistory type from Prisma
 */
export type FarmerPaymentHistory = FarmerPaymentHistoryModel;

/**
 * Request type for creating a payment history
 */
export interface CreatePaymentHistoryRequest {
  farmerStorageLinkId: string;
  date: Date;
  amount: number;
  type: 'RENT' | 'PAYMENT';
  remarks: string;
  createdBy?: string | null;
  voucherId?: string | null;
}

/**
 * Request type for updating a payment history
 */
export interface UpdatePaymentHistoryRequest {
  date?: Date;
  amount?: number;
  type?: 'RENT' | 'PAYMENT';
  remarks?: string;
  voucherId?: string | null;
}

/**
 * Response type for payment history operations
 */
export interface PaymentHistoryResponse {
  id: string;
  farmerStorageLinkId: string;
  date: Date;
  amount: number;
  type: 'RENT' | 'PAYMENT';
  remarks: string;
  createdBy: string | null;
  voucherId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response type for list operations
 */
export interface PaymentHistoryListResponse {
  data: PaymentHistoryResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

/**
 * Payment history with farmer storage link relation
 */
export interface PaymentHistoryWithRelations extends PaymentHistoryResponse {
  farmerStorageLink?: {
    id: string;
    accountNumber: number;
    farmer: {
      id: string;
      name: string;
      mobileNumber: string;
    };
  };
}
