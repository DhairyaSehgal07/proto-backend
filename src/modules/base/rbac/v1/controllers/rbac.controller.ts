import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  RBACService,
  RolePermissionNotFoundError,
  RolePermissionValidationError,
} from '../services/rbac.service.js';
import type { CreateOrUpdateRolePermissionRequest } from '../types/rbac.js';
import type {
  RoleParam,
  ColdStorageIdParam,
  CreateOrUpdateRolePermissionInput,
} from '../schemas/rbac.schema.js';

/**
 * Request types
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
 * Controller for RBAC endpoints
 */
export class RBACController {
  private readonly service: RBACService;

  constructor(fastify: FastifyInstance) {
    this.service = new RBACService(fastify);
  }

  /**
   * POST /rbac/permissions - Create or update role permissions
   */
  async createOrUpdateRolePermissions(
    request: FastifyRequest<CreateOrUpdateRolePermissionRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
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

      const body = request.body;
      // Convert schema input to service request type
      const serviceRequest: CreateOrUpdateRolePermissionRequest = {
        coldStorageId: body.coldStorageId,
        role: body.role,
        permissions: body.permissions as CreateOrUpdateRolePermissionRequest['permissions'],
      };
      const rolePermission = await this.service.createOrUpdateRolePermissions(
        serviceRequest,
        request.admin.id,
        request.admin.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: `Role permissions for ${body.role} updated successfully.`,
        data: rolePermission,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /rbac/permissions/:coldStorageId/:role - Get role permissions
   */
  async getRolePermissions(
    request: FastifyRequest<GetRolePermissionRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { coldStorageId, role } = request.params;
      const rolePermission = await this.service.getRolePermissions(
        coldStorageId,
        role,
        request.admin?.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: 'Role permissions retrieved successfully.',
        data: rolePermission,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /rbac/permissions/:coldStorageId - Get all role permissions
   */
  async getAllRolePermissions(
    request: FastifyRequest<GetAllRolePermissionsRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { coldStorageId } = request.params;
      const rolePermissions = await this.service.getAllRolePermissions(
        coldStorageId,
        request.admin?.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: 'Role permissions retrieved successfully.',
        data: rolePermissions,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * DELETE /rbac/permissions/:coldStorageId/:role - Deactivate role permissions
   */
  async deactivateRolePermissions(
    request: FastifyRequest<DeactivateRolePermissionRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { coldStorageId, role } = request.params;
      await this.service.deactivateRolePermissions(
        coldStorageId,
        role,
        request.admin?.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: `Role permissions for ${role} deactivated successfully.`,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /rbac/admins/:coldStorageId - Get all admins in a cold storage
   */
  async getColdStorageAdmins(
    request: FastifyRequest<GetColdStorageAdminsRequestParams>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { coldStorageId } = request.params;
      const admins = await this.service.getColdStorageAdmins(
        coldStorageId,
        request.admin?.coldStorageId
      );
      console.log('admins are: ', admins);

      reply.code(200).send({
        success: true,
        message: 'Admins retrieved successfully.',
        data: admins,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /rbac/my-permissions - Get current admin's permissions
   */
  async getMyPermissions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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

      const permissions = await this.service.getMyPermissions(
        request.admin.id,
        request.admin.role,
        request.admin.coldStorageId
      );

      reply.code(200).send({
        success: true,
        message: 'Your permissions retrieved successfully.',
        data: permissions,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Centralized error handler
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof Error) reply.log.error(error);

    if (error instanceof RolePermissionNotFoundError) {
      reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }

    if (error instanceof RolePermissionValidationError) {
      reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
      return;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2025') {
        reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Role permission not found' },
        });
        return;
      }
      if (prismaError.code === 'P2002') {
        reply.code(409).send({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' },
        });
        return;
      }
    }

    reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected error occurred',
      },
    });
  }
}
