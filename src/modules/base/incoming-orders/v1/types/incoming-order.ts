import type { Commodity, GatePassType } from '../../../../../../generated/prisma/client.js';

/**
 * BagSize type for incoming orders
 */
export interface BagSizeInput {
  name: string;
  quantityInit: number;
  quantityCurr: number;
  approxWeight?: number;
  floor: string;
  row: string;
  chamber: string;
}

/**
 * Processed BagSize with locationId instead of floor/row/chamber
 */
export interface ProcessedBagSize {
  name: string;
  quantityInit: number;
  quantityCurr: number;
  approxWeight?: number;
  locationId: string;
}

/**
 * Variety type for incoming orders
 */
export interface VarietyInput {
  name: string;
  bagSizes: BagSizeInput[];
}

/**
 * Processed Variety with processed bagSizes
 */
export interface ProcessedVariety {
  name: string;
  bagSizes: ProcessedBagSize[];
}

/**
 * Request type for creating an incoming order
 */
export interface CreateIncomingOrderRequest {
  farmerStorageLinkId: string;
  commodity: Commodity;
  gatePassNumber: number;
  gatePassType?: GatePassType;
  remarks?: string;
  currentStockAtThatTime?: number;
  varieties?: VarietyInput[];
}

/**
 * Request type for updating an incoming order
 */
export interface UpdateIncomingOrderRequest {
  farmerStorageLinkId?: string;
  commodity?: Commodity;
  gatePassNumber?: number;
  gatePassType?: GatePassType;
  remarks?: string;
  currentStockAtThatTime?: number;
  varieties?: VarietyInput[];
}

/**
 * Response type for incoming order operations
 */
export interface IncomingOrderResponse {
  id: string;
  farmerStorageLinkId: string;
  coldStorageId: string | null;
  commodity: Commodity;
  gatePassType: GatePassType;
  gatePassNumber: number;
  remarks: string | null;
  currentStockAtThatTime: number | null;
  varieties: ProcessedVariety[];
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  farmerStorageLink?: {
    id: string;
    accountNumber: number;
    farmer: {
      id: string;
      name: string;
      address: string;
      mobileNumber: string;
      imageUrl: string | null;
    };
  };
  createdBy?: {
    id: string;
    name: string;
  };
}

/**
 * Response type for list operations
 */
export interface IncomingOrderListResponse {
  data: IncomingOrderResponse[];
  count: number;
}
