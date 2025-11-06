import type { FastifyInstance } from 'fastify';
import { Prisma } from '../../../../../../generated/prisma/client.js';
import type {
  CreateColdStorageRequest,
  UpdateColdStorageRequest,
  ColdStorage,
} from '../types/cold-storage.js';

/**
 * Data Access Object for ColdStorage
 * Handles all database operations
 */
export class ColdStorageDAO {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Get all cold storages with optional pagination and filtering
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: Prisma.ColdStorageWhereInput;
    orderBy?:
      | Prisma.ColdStorageOrderByWithRelationInput
      | Prisma.ColdStorageOrderByWithRelationInput[];
  }): Promise<ColdStorage[]> {
    try {
      return await this.fastify.prisma.coldStorage.findMany({
        skip: options?.skip,
        take: options?.take,
        where: options?.where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findAll cold storages');
      throw error;
    }
  }

  /**
   * Get total count of cold storages matching the filter
   */
  async count(where?: Prisma.ColdStorageWhereInput): Promise<number> {
    try {
      return await this.fastify.prisma.coldStorage.count({ where });
    } catch (error) {
      this.fastify.log.error(error, 'Error in count cold storages');
      throw error;
    }
  }

  /**
   * Get a cold storage by ID
   */
  async findById(id: string): Promise<ColdStorage | null> {
    try {
      return await this.fastify.prisma.coldStorage.findUnique({
        where: { id },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in findById cold storage: ${id}`);
      throw error;
    }
  }

  /**
   * Create a new cold storage
   */
  async create(data: CreateColdStorageRequest): Promise<ColdStorage> {
    try {
      return await this.fastify.prisma.coldStorage.create({
        data: {
          name: data.name,
          address: data.address,
          mobileNumber: data.mobileNumber,
          capacity: data.capacity,
          imageUrl: data.imageUrl ?? null,
          isPaid: data.isPaid ?? false,
          isActive: data.isActive ?? true,
          plan: data.plan ?? 'Basic',
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in create cold storage');
      throw error;
    }
  }

  /**
   * Update a cold storage by ID
   */
  async update(id: string, data: UpdateColdStorageRequest): Promise<ColdStorage> {
    try {
      return await this.fastify.prisma.coldStorage.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.mobileNumber !== undefined && { mobileNumber: data.mobileNumber }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.plan !== undefined && { plan: data.plan }),
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in update cold storage: ${id}`);
      throw error;
    }
  }

  /**
   * Delete a cold storage by ID
   */
  async delete(id: string): Promise<ColdStorage> {
    try {
      return await this.fastify.prisma.coldStorage.delete({
        where: { id },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in delete cold storage: ${id}`);
      throw error;
    }
  }
}
