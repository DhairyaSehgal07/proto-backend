/**
 * RBAC Configuration
 * Defines resources and operations available in the system
 */

/**
 * Resources that can have permissions
 */
export const RESOURCES = [
  'farmers',
  'incoming-orders',
  'outgoing-orders',
  'locations',
  'farmer-storage-links',
  'cold-storage', // for updating cold storage details
  'store-admins', // for managing other admins (Manager and Assistant roles)
  'payment-history', // for managing payment history
] as const;

/**
 * Operations available on resources
 */
export const OPERATIONS = ['create', 'read', 'update', 'delete'] as const;

/**
 * Type definitions
 */
export type Resource = (typeof RESOURCES)[number];
export type Operation = (typeof OPERATIONS)[number];

/**
 * Resource permission structure
 */
export interface ResourcePermission {
  resource: Resource;
  operations: Operation[];
}

/**
 * Valid roles in the system
 */
export const ROLES = {
  ADMIN: 'Admin', // Has all permissions
  MANAGER: 'Manager', // Has configured permissions
  ASSISTANT: 'Assistant', // Has configured permissions
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Check if a resource is valid
 */
export function isValidResource(resource: string): resource is Resource {
  return RESOURCES.includes(resource as Resource);
}

/**
 * Check if an operation is valid
 */
export function isValidOperation(operation: string): operation is Operation {
  return OPERATIONS.includes(operation as Operation);
}

/**
 * Validate resource permission structure
 */
export function validateResourcePermission(permission: unknown): permission is ResourcePermission {
  if (!permission || typeof permission !== 'object') {
    return false;
  }

  const perm = permission as Record<string, unknown>;

  if (!perm.resource || typeof perm.resource !== 'string') {
    return false;
  }

  if (!isValidResource(perm.resource)) {
    return false;
  }

  if (!Array.isArray(perm.operations) || perm.operations.length === 0) {
    return false;
  }

  return perm.operations.every((op) => typeof op === 'string' && isValidOperation(op));
}
