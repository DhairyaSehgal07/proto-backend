import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { RBACController } from '../controllers/rbac.controller.js';
import {
  createOrUpdateRolePermissionSchema,
  type CreateOrUpdateRolePermissionInput,
  type RoleParam,
  type ColdStorageIdParam,
} from '../schemas/rbac.schema.js';
import { authenticateAdmin, requireAdmin } from '@/core/middleware/auth.middleware.js';
import {
  createOrUpdateRolePermissionOptions,
  getRolePermissionOptions,
  getAllRolePermissionsOptions,
  deactivateRolePermissionOptions,
  getColdStorageAdminsOptions,
  getMyPermissionsOptions,
} from './options.js';
import { createBodyValidator, validateParams } from './validators.js';

/**
 * Request/Response types
 */
interface CreateOrUpdateRolePermissionRequestParams {
  Body: CreateOrUpdateRolePermissionInput;
}

interface GetRolePermissionRequestParams {
  Params: ColdStorageIdParam & RoleParam;
}

interface GetAllRolePermissionsRequestParams {
  Params: ColdStorageIdParam;
}

interface DeactivateRolePermissionRequestParams {
  Params: ColdStorageIdParam & RoleParam;
}

interface GetColdStorageAdminsRequestParams {
  Params: ColdStorageIdParam;
}

/**
 * Fastify route plugin for RBAC API
 */
function rbacRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): void {
  const controller = new RBACController(fastify);

  /**
   * POST /api/v1/base/rbac/permissions
   * Create or update role permissions (Admin role only)
   */
  fastify.post(
    '/permissions',
    {
      ...createOrUpdateRolePermissionOptions,
      preHandler: [
        authenticateAdmin,
        requireAdmin,
        createBodyValidator(createOrUpdateRolePermissionSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.createOrUpdateRolePermissions(
        request as FastifyRequest<CreateOrUpdateRolePermissionRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/permissions/:coldStorageId/:role
   * Get role permissions for a specific role (Admin role only)
   */
  fastify.get(
    '/permissions/:coldStorageId/:role',
    {
      ...getRolePermissionOptions,
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getRolePermissions(
        request as FastifyRequest<GetRolePermissionRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/permissions/:coldStorageId
   * Get all role permissions for a cold storage (Admin role only)
   */
  fastify.get(
    '/permissions/:coldStorageId',
    {
      ...getAllRolePermissionsOptions,
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getAllRolePermissions(
        request as FastifyRequest<GetAllRolePermissionsRequestParams>,
        reply
      );
    }
  );

  /**
   * DELETE /api/v1/base/rbac/permissions/:coldStorageId/:role
   * Deactivate role permissions (Admin role only)
   */
  fastify.delete(
    '/permissions/:coldStorageId/:role',
    {
      ...deactivateRolePermissionOptions,
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.deactivateRolePermissions(
        request as FastifyRequest<DeactivateRolePermissionRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/admins/:coldStorageId
   * Get all admins in a cold storage (Admin role only)
   */
  fastify.get(
    '/admins/:coldStorageId',
    {
      ...getColdStorageAdminsOptions,
      preHandler: [authenticateAdmin, requireAdmin, validateParams],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getColdStorageAdmins(
        request as FastifyRequest<GetColdStorageAdminsRequestParams>,
        reply
      );
    }
  );

  /**
   * GET /api/v1/base/rbac/my-permissions
   * Get current admin's permissions (Authenticated admin)
   */
  fastify.get(
    '/my-permissions',
    {
      ...getMyPermissionsOptions,
      preHandler: [authenticateAdmin],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.getMyPermissions(request, reply);
    }
  );
}

export default rbacRoutes;
