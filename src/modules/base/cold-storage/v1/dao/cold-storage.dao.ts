import type { FastifyInstance } from 'fastify';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';
import type { CreateColdStorageRequest, UpdateColdStorageRequest } from '../types/cold-storage.js';

/**
 * Type for ColdStorage with preferences relation included
 */
type ColdStorageWithPreferences = PrismaTypes.ColdStorageGetPayload<{
  include: { preferences: true };
}>;

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
  }): Promise<ColdStorageWithPreferences[]> {
    try {
      return await this.fastify.prisma.coldStorage.findMany({
        skip: options?.skip,
        take: options?.take,
        where: options?.where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
        include: {
          preferences: true,
        },
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
  async findById(id: string): Promise<ColdStorageWithPreferences | null> {
    try {
      this.fastify.log.info(`Finding cold storage with id: ${id}`);
      const result = await this.fastify.prisma.coldStorage.findUnique({
        where: { id },
        include: {
          preferences: true,
        },
      });
      this.fastify.log.info(
        `Cold storage query completed for id: ${id}, found: ${result ? 'yes' : 'no'}`
      );
      return result;
    } catch (error) {
      this.fastify.log.error(error, `Error in findById cold storage: ${id}`);
      throw error;
    }
  }

  /**
   * Create a new cold storage
   */
  async create(data: CreateColdStorageRequest): Promise<ColdStorageWithPreferences> {
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
          preferences: data.preferences
            ? {
                create: {
                  varieties: data.preferences.varieties ?? [],
                  commodities: data.preferences.commodities ?? [],
                  generation: data.preferences.generation ?? null,
                  rouging: data.preferences.rouging ?? null,
                  tuberType: data.preferences.tuberType ?? null,
                  grader: data.preferences.grader ?? null,
                  incoming: {
                    showCustomMarka: false,
                  },
                },
              }
            : undefined,
        },
        include: {
          preferences: true,
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
  async update(id: string, data: UpdateColdStorageRequest): Promise<ColdStorageWithPreferences> {
    try {
      const updateData: Prisma.ColdStorageUpdateInput = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.mobileNumber !== undefined && { mobileNumber: data.mobileNumber }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.plan !== undefined && { plan: data.plan }),
      };

      // Handle preferences update
      if (data.preferences !== undefined) {
        if (data.preferences === null) {
          // Delete existing preferences if any
          updateData.preferences = { delete: true };
        } else {
          // Upsert preferences (update if exists, create if not)
          updateData.preferences = {
            upsert: {
              create: {
                varieties: data.preferences.varieties ?? [],
                commodities: data.preferences.commodities ?? [],
                generation: data.preferences.generation ?? null,
                rouging: data.preferences.rouging ?? null,
                tuberType: data.preferences.tuberType ?? null,
                grader: data.preferences.grader ?? null,
                incoming: {
                  showCustomMarka: false,
                },
              },
              update: {
                varieties: data.preferences.varieties ?? [],
                commodities: data.preferences.commodities ?? [],
                generation: data.preferences.generation ?? null,
                rouging: data.preferences.rouging ?? null,
                tuberType: data.preferences.tuberType ?? null,
                grader: data.preferences.grader ?? null,
              },
            },
          };
        }
      }

      return await this.fastify.prisma.coldStorage.update({
        where: { id },
        data: updateData,
        include: {
          preferences: true,
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
  async delete(id: string): Promise<ColdStorageWithPreferences> {
    try {
      return await this.fastify.prisma.coldStorage.delete({
        where: { id },
        include: {
          preferences: true,
        },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in delete cold storage: ${id}`);
      throw error;
    }
  }
}
