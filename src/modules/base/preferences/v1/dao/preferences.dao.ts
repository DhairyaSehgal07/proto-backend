import type { FastifyInstance } from 'fastify';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';
import type { CreatePreferencesRequest, UpdatePreferencesRequest } from '../types/preferences.js';

/**
 * Type for Preferences with all relations
 */
type PreferencesWithRelations = PrismaTypes.PreferencesGetPayload<{
  include: Record<string, never>;
}>;

/**
 * Data Access Object for Preferences
 * Handles all database operations
 */
export class PreferencesDAO {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Get all preferences with optional pagination and filtering
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: Prisma.PreferencesWhereInput;
    orderBy?:
      | Prisma.PreferencesOrderByWithRelationInput
      | Prisma.PreferencesOrderByWithRelationInput[];
  }): Promise<PreferencesWithRelations[]> {
    try {
      return await this.fastify.prisma.preferences.findMany({
        skip: options?.skip,
        take: options?.take,
        where: options?.where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in findAll preferences');
      throw error;
    }
  }

  /**
   * Get total count of preferences matching the filter
   */
  async count(where?: Prisma.PreferencesWhereInput): Promise<number> {
    try {
      return await this.fastify.prisma.preferences.count({ where });
    } catch (error) {
      this.fastify.log.error(error, 'Error in count preferences');
      throw error;
    }
  }

  /**
   * Get preferences by ID
   */
  async findById(id: string): Promise<PreferencesWithRelations | null> {
    try {
      this.fastify.log.info(`Finding preferences with id: ${id}`);
      const result = await this.fastify.prisma.preferences.findUnique({
        where: { id },
      });
      this.fastify.log.info(
        `Preferences query completed for id: ${id}, found: ${result ? 'yes' : 'no'}`
      );
      return result;
    } catch (error) {
      this.fastify.log.error(error, `Error in findById preferences: ${id}`);
      throw error;
    }
  }

  /**
   * Create a new preferences
   */
  async create(data: CreatePreferencesRequest): Promise<PreferencesWithRelations> {
    try {
      return await this.fastify.prisma.preferences.create({
        data: {
          varieties: data.varieties ?? [],
          commodities: data.commodities ?? [],
          generation: data.generation ?? null,
          rouging: data.rouging ?? null,
          tuberType: data.tuberType ?? null,
          grader: data.grader ?? null,
          incoming: data.incoming ?? { showCustomMarka: false },
        },
      });
    } catch (error) {
      this.fastify.log.error(error, 'Error in create preferences');
      throw error;
    }
  }

  /**
   * Update preferences by ID
   */
  async update(id: string, data: UpdatePreferencesRequest): Promise<PreferencesWithRelations> {
    try {
      const updateData: Prisma.PreferencesUpdateInput = {
        ...(data.varieties !== undefined && { varieties: data.varieties }),
        ...(data.commodities !== undefined && { commodities: data.commodities }),
        ...(data.generation !== undefined && { generation: data.generation }),
        ...(data.rouging !== undefined && { rouging: data.rouging }),
        ...(data.tuberType !== undefined && { tuberType: data.tuberType }),
        ...(data.grader !== undefined && { grader: data.grader }),
        ...(data.incoming !== undefined && { incoming: data.incoming }),
      };

      return await this.fastify.prisma.preferences.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in update preferences: ${id}`);
      throw error;
    }
  }

  /**
   * Delete preferences by ID
   */
  async delete(id: string): Promise<PreferencesWithRelations> {
    try {
      return await this.fastify.prisma.preferences.delete({
        where: { id },
      });
    } catch (error) {
      this.fastify.log.error(error, `Error in delete preferences: ${id}`);
      throw error;
    }
  }
}
