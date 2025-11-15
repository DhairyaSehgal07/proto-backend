import type { PreferencesModel } from '../../../../../../generated/prisma/models/Preferences.js';

/**
 * Complete Preferences type from Prisma
 */
export type Preferences = PreferencesModel;

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
 * Preferences type for API responses (excludes internal fields)
 */
export interface PreferencesResponse {
  id: string;
  varieties: string[];
  commodities: CommodityObj[];
  generation: string | null;
  rouging: string | null;
  tuberType: string | null;
  grader: string | null;
  incoming: IncomingPrefs;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request type for creating preferences
 */
export interface CreatePreferencesRequest {
  varieties?: string[];
  commodities?: CommodityObj[];
  generation?: string | null;
  rouging?: string | null;
  tuberType?: string | null;
  grader?: string | null;
  incoming?: IncomingPrefs;
}

/**
 * Request type for updating preferences
 */
export interface UpdatePreferencesRequest {
  varieties?: string[];
  commodities?: CommodityObj[];
  generation?: string | null;
  rouging?: string | null;
  tuberType?: string | null;
  grader?: string | null;
  incoming?: IncomingPrefs;
}

/**
 * Response type for list operations
 */
export interface PreferencesListResponse {
  data: PreferencesResponse[];
  count: number;
}
