import type { ColdStorageModel } from '../../../../../../generated/prisma/models/ColdStorage.js';

/**
 * Complete ColdStorage type from Prisma
 */
export type ColdStorage = ColdStorageModel;

/**
 * Commodity object type matching Prisma schema
 */
export interface CommodityObj {
  name: string;
  varieties: string[];
  sizes: string[];
}

/**
 * Preferences type for API responses (excludes internal fields)
 */
export interface Preferences {
  commodities: CommodityObj[];
  generation: string | null;
  rouging: string | null;
  tuberType: string | null;
  grader: string | null;
  incoming?: {
    showCustomMarka: boolean;
  };
  customFields?: Record<string, any> | null;
}

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
  preferences?: Preferences | null;
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
  preferences?: Preferences | null;
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
  preferences: Preferences | null;
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
