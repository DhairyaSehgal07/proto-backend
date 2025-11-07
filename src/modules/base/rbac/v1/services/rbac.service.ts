import type { FastifyInstance } from 'fastify';
import { Prisma } from '../../../../../../generated/prisma/client.js';
import { RolePermissionDAO } from '../dao/rbac.dao.js';
import { StoreAdminDAO } from '@/modules/base/store-admin/v1/dao/store-admin.dao.js';
import type {
  CreateOrUpdateRolePermissionRequest,
  RolePermissionResponse,
  MyPermissionsResponse,
  ColdStorageAdminsResponse,
  ResourcePermission,
} from '../types/rbac.js';
import { RESOURCES, OPERATIONS } from '@/config/rbac.js';

/**
 * Custom error classes
 */
export class RolePermissionNotFoundError extends Error {
  constructor(role: string) {
    super(`Role permissions for ${role} not found`);
    this.name = 'RolePermissionNotFoundError';
  }
}

export class RolePermissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RolePermissionValidationError';
  }
}

/**
 * Service layer for RBAC
 */
export class RBACService {
  private readonly rolePermissionDAO: RolePermissionDAO;
  private readonly storeAdminDAO: StoreAdminDAO;
  private readonly fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.rolePermissionDAO = new RolePermissionDAO(fastify);
    this.storeAdminDAO = new StoreAdminDAO(fastify);
  }

  /**
   * Create or update role permissions
   */
  async createOrUpdateRolePermissions(
    data: CreateOrUpdateRolePermissionRequest,
    createdById: string,
    adminColdStorageId?: string
  ): Promise<RolePermissionResponse> {
    // Validate cold storage exists
    const coldStorage = await this.fastify.prisma.coldStorage.findUnique({
      where: { id: data.coldStorageId },
    });

    if (!coldStorage) {
      throw new RolePermissionValidationError('Cold storage not found');
    }

    // Ensure Admin can only manage permissions for their own cold storage
    if (adminColdStorageId && data.coldStorageId !== adminColdStorageId) {
      throw new RolePermissionValidationError(
        'Access denied. You can only manage permissions for your own cold storage.'
      );
    }

    // Verify that admins with this role exist in the cold storage
    const where: Prisma.StoreAdminWhereInput = {
      coldStorageId: data.coldStorageId,
      role: data.role,
      isVerified: true,
    };
    const adminsWithRole = await this.storeAdminDAO.count(where);

    if (adminsWithRole === 0) {
      throw new RolePermissionValidationError(
        `No ${data.role} admins found in this cold storage. Please ensure there are ${data.role} admins linked to this cold storage before setting permissions.`
      );
    }

    // Create or update
    const rolePermission = await this.rolePermissionDAO.createOrUpdate({
      ...data,
      createdById,
    });

    return this.mapToResponse(rolePermission);
  }

  /**
   * Get role permissions for a specific role
   */
  async getRolePermissions(
    coldStorageId: string,
    role: 'Manager' | 'Assistant',
    adminColdStorageId?: string
  ): Promise<RolePermissionResponse> {
    // Ensure Admin can only view permissions for their own cold storage
    if (adminColdStorageId && coldStorageId !== adminColdStorageId) {
      throw new RolePermissionValidationError(
        'Access denied. You can only view permissions for your own cold storage.'
      );
    }

    const rolePermission = await this.rolePermissionDAO.findByRoleAndColdStorage(
      role,
      coldStorageId
    );

    if (!rolePermission || !rolePermission.isActive) {
      throw new RolePermissionNotFoundError(role);
    }

    return this.mapToResponse(rolePermission);
  }

  /**
   * Get all role permissions for a cold storage
   */
  async getAllRolePermissions(
    coldStorageId: string,
    adminColdStorageId?: string
  ): Promise<RolePermissionResponse[]> {
    // Ensure Admin can only view permissions for their own cold storage
    if (adminColdStorageId && coldStorageId !== adminColdStorageId) {
      throw new RolePermissionValidationError(
        'Access denied. You can only view permissions for your own cold storage.'
      );
    }

    const rolePermissions = await this.rolePermissionDAO.findAllActiveByColdStorage(coldStorageId);

    return rolePermissions.map((rp) => this.mapToResponse(rp));
  }

  /**
   * Deactivate role permissions
   */
  async deactivateRolePermissions(
    coldStorageId: string,
    role: 'Manager' | 'Assistant',
    adminColdStorageId?: string
  ): Promise<void> {
    // Ensure Admin can only deactivate permissions for their own cold storage
    if (adminColdStorageId && coldStorageId !== adminColdStorageId) {
      throw new RolePermissionValidationError(
        'Access denied. You can only manage permissions for your own cold storage.'
      );
    }

    const rolePermission = await this.rolePermissionDAO.deactivate(coldStorageId, role);

    if (!rolePermission) {
      throw new RolePermissionNotFoundError(role);
    }
  }

  /**
   * Get all admins in a cold storage
   */
  async getColdStorageAdmins(
    coldStorageId: string,
    adminColdStorageId?: string
  ): Promise<ColdStorageAdminsResponse> {
    // Ensure Admin can only view admins in their own cold storage
    if (adminColdStorageId && coldStorageId !== adminColdStorageId) {
      throw new RolePermissionValidationError(
        'Access denied. You can only view admins in your own cold storage.'
      );
    }

    const admins = await this.storeAdminDAO.findAll({
      where: {
        coldStorageId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group admins by role
    const adminsByRole = {
      Admin: admins.filter((admin) => admin.role === 'Admin'),
      Manager: admins.filter((admin) => admin.role === 'Manager'),
      Assistant: admins.filter((admin) => admin.role === 'Assistant'),
    };

    return {
      total: admins.length,
      byRole: adminsByRole,
      all: admins.map((admin) => ({
        id: admin.id,
        name: admin.name,
        mobileNumber: admin.mobileNumber,
        role: admin.role,
        isVerified: admin.isVerified,
        coldStorageId: admin.coldStorageId,
      })),
    };
  }

  /**
   * Get current admin's permissions
   */
  async getMyPermissions(
    adminId: string,
    role: string,
    coldStorageId: string
  ): Promise<MyPermissionsResponse> {
    // Admin role has all permissions
    if (role === 'Admin') {
      return {
        role: 'Admin',
        permissions: RESOURCES.map((resource) => ({
          resource,
          operations: [...OPERATIONS],
        })),
      };
    }

    // Get permissions for the admin's role and cold storage
    const rolePermission = await this.rolePermissionDAO.findActiveByRoleAndColdStorage(
      role,
      coldStorageId
    );

    if (!rolePermission) {
      throw new RolePermissionNotFoundError(role);
    }

    const coldStorage = await this.fastify.prisma.coldStorage.findUnique({
      where: { id: coldStorageId },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    return {
      role: rolePermission.role,
      coldStorage: coldStorage || undefined,
      permissions: rolePermission.permissions as ResourcePermission[],
    };
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(
    rolePermission: Awaited<
      ReturnType<typeof this.rolePermissionDAO.findActiveByRoleAndColdStorage>
    >
  ): RolePermissionResponse {
    if (!rolePermission) {
      throw new Error('Role permission is null');
    }

    return {
      id: rolePermission.id,
      coldStorageId: rolePermission.coldStorageId,
      role: rolePermission.role as 'Manager' | 'Assistant',
      permissions: rolePermission.permissions as ResourcePermission[],
      createdById: rolePermission.createdById,
      isActive: rolePermission.isActive,
      createdAt: rolePermission.createdAt,
      updatedAt: rolePermission.updatedAt,
      coldStorage: rolePermission.coldStorage
        ? {
            id: rolePermission.coldStorage.id,
            name: rolePermission.coldStorage.name,
            address: rolePermission.coldStorage.address,
          }
        : undefined,
      createdBy: rolePermission.createdBy
        ? {
            id: rolePermission.createdBy.id,
            name: rolePermission.createdBy.name,
            mobileNumber: rolePermission.createdBy.mobileNumber,
          }
        : undefined,
    };
  }
}
