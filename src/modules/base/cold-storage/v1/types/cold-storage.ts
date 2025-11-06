import type { ColdStorageModel } from '../../../../../../generated/prisma/models/ColdStorage.js';

/**
 * Complete ColdStorage type from Prisma
 */
export type ColdStorage = ColdStorageModel;

/**
 * Request type for creating a cold storage
 */
export interface CreateColdStorageRequest {
  name: string;
  address: string;
  mobileNumber: string;
  capacity: number;
  imageUrl?: string | null;
  isPaid?: boolean;
  isActive?: boolean;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
}

/**
 * Request type for updating a cold storage
 */
export interface UpdateColdStorageRequest {
  name?: string;
  address?: string;
  mobileNumber?: string;
  capacity?: number;
  imageUrl?: string | null;
  isPaid?: boolean;
  isActive?: boolean;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
}

/**
 * Response type for cold storage operations
 */
export interface ColdStorageResponse {
  id: string;
  name: string;
  address: string;
  mobileNumber: string;
  capacity: number;
  imageUrl: string | null;
  isPaid: boolean;
  isActive: boolean;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response type for list operations
 */
export interface ColdStorageListResponse {
  data: ColdStorageResponse[];
  count: number;
}
