import type { Resource, Operation } from '@/config/rbac.js';

/**
 * Resource permission structure
 */
export interface ResourcePermission {
  resource: Resource;
  operations: Operation[];
}

/**
 * Create/Update role permission request
 */
export interface CreateOrUpdateRolePermissionRequest {
  coldStorageId: string;
  role: 'Manager' | 'Assistant';
  permissions: ResourcePermission[];
}

/**
 * Role permission response
 */
export interface RolePermissionResponse {
  id: string;
  coldStorageId: string;
  role: 'Manager' | 'Assistant';
  permissions: ResourcePermission[];
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  coldStorage?: {
    id: string;
    name: string;
    address: string;
  };
  createdBy?: {
    id: string;
    name: string;
    mobileNumber: string;
  };
}

/**
 * My permissions response
 */
export interface MyPermissionsResponse {
  role: string;
  coldStorage?: {
    id: string;
    name: string;
    address: string;
  };
  permissions: ResourcePermission[];
}

/**
 * Cold storage admins response
 */
export interface ColdStorageAdminsResponse {
  total: number;
  byRole: {
    Admin: Array<{
      id: string;
      name: string;
      mobileNumber: string;
      role: string;
      isVerified: boolean;
      coldStorageId: string;
    }>;
    Manager: Array<{
      id: string;
      name: string;
      mobileNumber: string;
      role: string;
      isVerified: boolean;
      coldStorageId: string;
    }>;
    Assistant: Array<{
      id: string;
      name: string;
      mobileNumber: string;
      role: string;
      isVerified: boolean;
      coldStorageId: string;
    }>;
  };
  all: Array<{
    id: string;
    name: string;
    mobileNumber: string;
    role: string;
    isVerified: boolean;
    coldStorageId: string;
  }>;
}
