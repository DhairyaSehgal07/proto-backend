import type { StoreAdminModel } from '../../../../../../generated/prisma/models/StoreAdmin.js';

/**
 * Complete StoreAdmin type from Prisma
 */
export type StoreAdmin = StoreAdminModel;

/**
 * Request type for creating a store admin
 */
export interface CreateStoreAdminRequest {
  coldStorageId: string;
  name: string;
  personalAddress?: string | null;
  mobileNumber: string;
  password: string;
  role?: 'Admin' | 'Manager' | 'Assistant';
  isVerified?: boolean;
}

/**
 * Request type for updating a store admin
 */
export interface UpdateStoreAdminRequest {
  name?: string;
  personalAddress?: string | null;
  mobileNumber?: string;
  password?: string;
  role?: 'Admin' | 'Manager' | 'Assistant';
  isVerified?: boolean;
}

/**
 * Response type for store admin operations (excludes password)
 */
export interface StoreAdminResponse {
  id: string;
  coldStorageId: string;
  name: string;
  personalAddress: string | null;
  mobileNumber: string;
  role: 'Admin' | 'Manager' | 'Assistant';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response type for list operations
 */
export interface StoreAdminListResponse {
  data: StoreAdminResponse[];
  count: number;
}

/**
 * Login request type
 */
export interface LoginStoreAdminRequest {
  mobileNumber: string;
  password: string;
  isMobile?: boolean;
}

/**
 * Login response type
 */
export interface LoginStoreAdminResponse {
  admin: StoreAdminResponse;
  token: string;
}

/**
 * Register farmer request type
 */
export interface RegisterFarmerRequest {
  name: string;
  address: string;
  mobileNumber: string;
  imageUrl?: string;
  accountNumber: number;
  notes?: string;
}

/**
 * Register farmer response type
 */
export interface RegisterFarmerResponse {
  farmer: {
    id: string;
    name: string;
    address: string;
    mobileNumber: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  link: {
    id: string;
    farmerId: string;
    coldStorageId: string;
    linkedById: string | null;
    accountNumber: string;
    isActive: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}
