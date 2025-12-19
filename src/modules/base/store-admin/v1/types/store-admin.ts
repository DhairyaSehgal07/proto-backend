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
 * Commodity object type matching Prisma schema
 */
export interface CommodityObj {
  name: string;
  sizes: string[];
}

/**
 * Incoming preferences type
 */
export interface IncomingPrefs {
  showCustomMarka: boolean;
}

/**
 * Preferences type for API responses (includes id)
 */
export interface Preferences {
  id: string;
  varieties: string[];
  commodities: CommodityObj[];
  generation: string | null;
  rouging: string | null;
  tuberType: string | null;
  grader: string | null;
  incoming: IncomingPrefs;
}

/**
 * Cold Storage response type with preferences
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
 * Login response type
 */
export interface LoginStoreAdminResponse {
  admin: StoreAdminResponse;
  coldStorage: ColdStorageResponse;
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

/**
 * Daybook order item (union of incoming and outgoing orders)
 */
export interface DaybookOrderItem {
  id: string;
  type: 'incoming' | 'outgoing';
  farmerStorageLinkId: string;
  coldStorageId: string | null;
  commodity: string;
  gatePassType: string;
  date: Date;
  gatePassNumber: number;
  remarks: string | null;
  currentStockAtThatTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  farmerStorageLink?: {
    id: string;
    accountNumber?: number;
    farmer: {
      id: string;
      name: string;
      address: string;
      mobileNumber: string;
      imageUrl: string | null;
    };
  };
  // Incoming order specific fields
  varieties?: Array<{
    name: string;
    bagSizes: Array<{
      name: string;
      quantityInit: number;
      quantityCurr: number;
      approxWeight?: number;
      customMarka?: string;
      locationId: string;
      incomingOrderId?: string;
      floor?: string;
      row?: string;
      chamber?: string;
    }>;
  }>;
  // Outgoing order specific fields
  totalBags?: number | null;
  totalWeight?: number | null;
  createdBy?: {
    id: string;
    name: string;
  };
}

/**
 * Daybook response type
 */
export interface DaybookResponse {
  data: DaybookOrderItem[];
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
 * Farmer response type for /farmer route
 */
export interface FarmerResponse {
  id: string; // farmerStorageLink id
  farmerId: string; // farmer document id
  name: string;
  mobileNumber: string;
  address: string;
  accountNumber: number;
  isActive: boolean;
}

/**
 * Farmers list response type
 */
export interface FarmersListResponse {
  data: FarmerResponse[];
}

/**
 * Gate pass number response type
 */
export interface GatePassNumberResponse {
  nextGatePassNumber: number;
  commodity: string;
  coldStorageId: string;
  type: 'incoming' | 'outgoing';
}

/**
 * Farmer orders response type (no pagination, returns all orders)
 */
export interface FarmerOrdersResponse {
  data: DaybookOrderItem[];
}

/**
 * Farmer detail response type (farmerStorageLink with populated farmer and linkedBy)
 */
export interface FarmerDetailResponse {
  id: string; // farmerStorageLink id
  farmerId: string; // farmer document id
  coldStorageId: string;
  accountNumber: number;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  farmer: {
    id: string;
    name: string;
    address: string;
    mobileNumber: string;
  };
  linkedBy: {
    id: string;
    name: string;
  } | null;
}
