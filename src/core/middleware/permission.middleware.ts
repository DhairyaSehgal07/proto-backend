import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Resource, Operation } from '@/config/rbac.js';
import { RolePermissionDAO } from '@/modules/base/rbac/v1/dao/rbac.dao.js';

/**
 * Middleware factory to check if admin has permission for a specific resource and operation
 * @param resource - The resource name (e.g., "farmers", "incoming-orders")
 * @param operation - The operation (e.g., "create", "read", "update", "delete")
 */
export function requirePermission(resource: Resource, operation: Operation) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      if (!request.admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required.',
          },
        });
        return;
      }

      // Admin role has all permissions
      if (request.admin.role === 'Admin') {
        return;
      }

      // Get permissions for the admin's role and cold storage
      const dao = new RolePermissionDAO(request.server);
      const rolePermission = await dao.findActiveByRoleAndColdStorage(
        request.admin.role,
        request.admin.coldStorageId
      );

      if (!rolePermission) {
        reply.code(403).send({
          success: false,
          error: {
            code: 'NO_PERMISSIONS_CONFIGURED',
            message: `No permissions configured for ${request.admin.role} role.`,
          },
        });
        return;
      }

      // Check if the resource and operation are allowed
      const hasPermission = rolePermission.permissions.some(
        (perm) => perm.resource === resource && perm.operations.includes(operation)
      );

      if (!hasPermission) {
        reply.code(403).send({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Access denied. You do not have ${operation} permission for ${resource}.`,
          },
        });
      }
    } catch (error) {
      request.server.log.error(error, 'Permission check error');
      reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Permission check error',
        },
      });
    }
  };
}
