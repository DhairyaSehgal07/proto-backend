import type { FastifyInstance } from 'fastify';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';
import type { CreateStoreAdminRequest, UpdateStoreAdminRequest } from '../types/store-admin.js';

/**
 * Type for StoreAdmin with coldStorage relation included
 */
type StoreAdminWithRelations = PrismaTypes.StoreAdminGetPayload<{
  include: { coldStorage: true };
}>;

/**
 * Data Access Object for StoreAdmin
 * Handles all database operations
 */
export class StoreAdminDAO {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Get all store admins with optional pagination and filtering
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: Prisma.StoreAdminWhereInput;
    orderBy?:
      | Prisma.StoreAdminOrderByWithRelationInput
      | Prisma.StoreAdminOrderByWithRelationInput[];
  }): Promise<StoreAdminWithRelations[]> {
    try {
      return await this.fastify.prisma.storeAdmin.findMany({
        skip: options?.skip,
        take: options?.take,
        where: options?.where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
        include: {
          coldStorage: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findAll store admins');
      throw error;
    }
  }

  /**
   * Get total count of store admins matching the filter
   */
  async count(where?: Prisma.StoreAdminWhereInput): Promise<number> {
    try {
      return await this.fastify.prisma.storeAdmin.count({ where });
    } catch (error) {
      this.fastify.log.error(error, 'Error in count store admins');
      throw error;
    }
  }

  /**
   * Get a store admin by ID
   */
  async findById(id: string): Promise<StoreAdminWithRelations | null> {
    try {
      return await this.fastify.prisma.storeAdmin.findUnique({
        where: { id },
        include: {
          coldStorage: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in findById store admin: ${id}`);
      throw error;
    }
  }

  /**
   * Create a new store admin
   */
  async create(data: CreateStoreAdminRequest): Promise<StoreAdminWithRelations> {
    try {
      return await this.fastify.prisma.storeAdmin.create({
        data: {
          coldStorageId: data.coldStorageId,
          name: data.name,
          personalAddress: data.personalAddress ?? null,
          mobileNumber: data.mobileNumber,
          password: data.password,
          role: data.role ?? 'Manager',
          isVerified: data.isVerified ?? false,
        },
        include: {
          coldStorage: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in create store admin');
      throw error;
    }
  }

  /**
   * Update a store admin by ID
   */
  async update(id: string, data: UpdateStoreAdminRequest): Promise<StoreAdminWithRelations> {
    try {
      const updateData: Prisma.StoreAdminUpdateInput = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.personalAddress !== undefined && { personalAddress: data.personalAddress }),
        ...(data.mobileNumber !== undefined && { mobileNumber: data.mobileNumber }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
      };

      return await this.fastify.prisma.storeAdmin.update({
        where: { id },
        data: updateData,
        include: {
          coldStorage: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in update store admin: ${id}`);
      throw error;
    }
  }

  /**
   * Delete a store admin by ID
   */
  async delete(id: string): Promise<StoreAdminWithRelations> {
    try {
      return await this.fastify.prisma.storeAdmin.delete({
        where: { id },
        include: {
          coldStorage: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in delete store admin: ${id}`);
      throw error;
    }
  }

  /**
   * Find store admin by mobile number
   * Note: Mobile number is unique per cold storage, but may exist across multiple cold storages
   */
  async findByMobileNumber(mobileNumber: string): Promise<StoreAdminWithRelations | null> {
    try {
      return await this.fastify.prisma.storeAdmin.findFirst({
        where: {
          mobileNumber,
        },
        include: {
          coldStorage: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in findByMobileNumber: ${mobileNumber}`);
      throw error;
    }
  }
}
