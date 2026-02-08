import type { GatePassType } from '../../../../../../generated/prisma/client.js';

/**
 * BagSizeSnapshot type for outgoing orders
 */
export interface BagSizeSnapshotInput {
  name: string;
  locationId: string;
  incomingOrderId: string;
  varietyName: string;
  quantityBefore: number;
  quantityRemoved: number;
  quantityAfter: number;
  approxWeight?: number;
  floor?: string;
  row?: string;
  chamber?: string;
}

/**
 * VarietySnapshot type for outgoing orders
 */
export interface VarietySnapshotInput {
  name: string;
  bagSizes: BagSizeSnapshotInput[];
}

/**
 * Request type for creating an outgoing order
 */
export interface CreateOutgoingOrderRequest {
  farmerStorageLinkId: string;
  commodity: string;
  gatePassNumber: number;
  gatePassType?: GatePassType;
  date?: Date;
  remarks?: string;
  currentStockAtThatTime?: number;
  varieties?: VarietySnapshotInput[];
}

/**
 * Request type for updating an outgoing order
 */
export interface UpdateOutgoingOrderRequest {
  farmerStorageLinkId?: string;
  commodity?: string;
  gatePassNumber?: number;
  gatePassType?: GatePassType;
  date?: Date;
  remarks?: string;
  currentStockAtThatTime?: number;
  varieties?: VarietySnapshotInput[];
}

/**
 * Response type for outgoing order operations
 */
export interface OutgoingOrderResponse {
  id: string;
  farmerStorageLinkId: string;
  coldStorageId: string | null;
  commodity: string;
  gatePassType: GatePassType;
  gatePassNumber: number;
  date: Date | null;
  remarks: string | null;
  currentStockAtThatTime: number | null;
  varieties: VarietySnapshotInput[];
  totalBags: number | null;
  totalWeight: number | null;
  createdById: string | null;
  approvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  farmerStorageLink?: {
    id: string;
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
export interface OutgoingOrderListResponse {
  data: OutgoingOrderResponse[];
  count: number;
}
