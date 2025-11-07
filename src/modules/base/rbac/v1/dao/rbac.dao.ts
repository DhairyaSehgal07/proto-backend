import type { FastifyInstance } from 'fastify';
import type { Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';
import type { Role } from '../../../../../../generated/prisma/enums.js';
import type { ResourcePermission } from '../types/rbac.js';

/**
 * Type for RolePermission with relations included (with selected fields)
 */
type RolePermissionWithRelations = PrismaTypes.RolePermissionGetPayload<{
  include: {
    coldStorage: {
      select: {
        id: true;
        name: true;
        address: true;
      };
    };
    createdBy: {
      select: {
        id: true;
        name: true;
        mobileNumber: true;
      };
    };
  };
}>;

/**
 * Data Access Object for RolePermission
 * Handles all database operations
 */
export class RolePermissionDAO {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Find active role permission by role and cold storage
   */
  async findActiveByRoleAndColdStorage(
    role: string,
    coldStorageId: string
  ): Promise<RolePermissionWithRelations | null> {
    try {
      return await this.fastify.prisma.rolePermission.findFirst({
        where: {
          coldStorageId,
          role: role as Role,
          isActive: true,
        },
        include: {
          coldStorage: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findActiveByRoleAndColdStorage');
      throw error;
    }
  }

  /**
   * Find role permission by role and cold storage (any status)
   */
  async findByRoleAndColdStorage(
    role: string,
    coldStorageId: string
  ): Promise<RolePermissionWithRelations | null> {
    try {
      return await this.fastify.prisma.rolePermission.findUnique({
        where: {
          coldStorageId_role: {
            coldStorageId,
            role: role as Role,
          },
        },
        include: {
          coldStorage: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findByRoleAndColdStorage');
      throw error;
    }
  }

  /**
   * Find all active role permissions for a cold storage
   */
  async findAllActiveByColdStorage(coldStorageId: string): Promise<RolePermissionWithRelations[]> {
    try {
      return await this.fastify.prisma.rolePermission.findMany({
        where: {
          coldStorageId,
          isActive: true,
        },
        include: {
          coldStorage: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findAllActiveByColdStorage');
      throw error;
    }
  }

  /**
   * Create or update role permission
   */
  async createOrUpdate(data: {
    coldStorageId: string;
    role: 'Manager' | 'Assistant';
    permissions: ResourcePermission[];
    createdById: string;
  }): Promise<RolePermissionWithRelations> {
    try {
      const result = await this.fastify.prisma.rolePermission.upsert({
        where: {
          coldStorageId_role: {
            coldStorageId: data.coldStorageId,
            role: data.role,
          },
        },
        create: {
          coldStorageId: data.coldStorageId,
          role: data.role,
          permissions: {
            set: data.permissions,
          },
          createdById: data.createdById,
          isActive: true,
        },
        update: {
          permissions: {
            set: data.permissions,
          },
          createdById: data.createdById,
          isActive: true,
        },
        include: {
          coldStorage: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
            },
          },
        },
      });
      return result as RolePermissionWithRelations;
    } catch (error) {
      this.fastify.log.error(error, 'Error in createOrUpdate role permission');
      throw error;
    }
  }

  /**
   * Deactivate role permission (soft delete)
   */
  async deactivate(
    coldStorageId: string,
    role: 'Manager' | 'Assistant'
  ): Promise<RolePermissionWithRelations | null> {
    try {
      return await this.fastify.prisma.rolePermission.update({
        where: {
          coldStorageId_role: {
            coldStorageId,
            role,
          },
        },
        data: {
          isActive: false,
        },
        include: {
          coldStorage: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
            },
          },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in deactivate role permission');
      throw error;
    }
  }
}
