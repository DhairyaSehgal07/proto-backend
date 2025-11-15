import type { FastifyInstance } from 'fastify';
import { PreferencesDAO } from '../dao/preferences.dao.js';
import type {
  CreatePreferencesRequest,
  UpdatePreferencesRequest,
  PreferencesResponse,
  PreferencesListResponse,
} from '../types/preferences.js';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';

/**
 * Custom error classes for business logic
 */
export class PreferencesNotFoundError extends Error {
  constructor(id: string) {
    super(`Preferences with id ${id} not found`);
    this.name = 'PreferencesNotFoundError';
  }
}

export class PreferencesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreferencesValidationError';
  }
}

/**
 * Service layer for Preferences
 * Contains business logic and orchestrates DAO operations
 */
export class PreferencesService {
  private readonly dao: PreferencesDAO;

  constructor(fastify: FastifyInstance) {
    this.dao = new PreferencesDAO(fastify);
  }

  /**
   * Get all preferences with pagination and optional search
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PreferencesListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: Prisma.PreferencesWhereInput = {};

    if (options?.search) {
      where.OR = [
        { generation: { contains: options.search, mode: 'insensitive' } },
        { rouging: { contains: options.search, mode: 'insensitive' } },
        { tuberType: { contains: options.search, mode: 'insensitive' } },
        { grader: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [preferences, count] = await Promise.all([
      this.dao.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.dao.count(where),
    ]);

    return {
      data: preferences.map((pref) => this.mapToResponse(pref)),
      count,
    };
  }

  /**
   * Get a single preferences by ID
   */
  async getById(id: string): Promise<PreferencesResponse> {
    const preferences = await this.dao.findById(id);

    if (!preferences) {
      throw new PreferencesNotFoundError(id);
    }

    return this.mapToResponse(preferences);
  }

  /**
   * Create a new preferences
   */
  async create(data: CreatePreferencesRequest): Promise<PreferencesResponse> {
    const preferences = await this.dao.create({
      varieties: data.varieties ?? [],
      commodities: data.commodities ?? [],
      generation: data.generation ?? null,
      rouging: data.rouging ?? null,
      tuberType: data.tuberType ?? null,
      grader: data.grader ?? null,
      incoming: data.incoming ?? { showCustomMarka: false },
    });

    return this.mapToResponse(preferences);
  }

  /**
   * Update an existing preferences
   */
  async update(id: string, data: UpdatePreferencesRequest): Promise<PreferencesResponse> {
    // Check if preferences exists
    const existingPreferences = await this.dao.findById(id);
    if (!existingPreferences) {
      throw new PreferencesNotFoundError(id);
    }

    const preferences = await this.dao.update(id, {
      ...(data.varieties !== undefined && { varieties: data.varieties }),
      ...(data.commodities !== undefined && { commodities: data.commodities }),
      ...(data.generation !== undefined && { generation: data.generation }),
      ...(data.rouging !== undefined && { rouging: data.rouging }),
      ...(data.tuberType !== undefined && { tuberType: data.tuberType }),
      ...(data.grader !== undefined && { grader: data.grader }),
      ...(data.incoming !== undefined && { incoming: data.incoming }),
    });

    return this.mapToResponse(preferences);
  }

  /**
   * Delete preferences by ID
   */
  async delete(id: string): Promise<void> {
    // Check if preferences exists
    const existingPreferences = await this.dao.findById(id);
    if (!existingPreferences) {
      throw new PreferencesNotFoundError(id);
    }

    await this.dao.delete(id);
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(
    preferences: PrismaTypes.PreferencesGetPayload<Record<string, never>>
  ): PreferencesResponse {
    return {
      id: preferences.id,
      varieties: preferences.varieties ?? [],
      commodities: preferences.commodities ?? [],
      generation: preferences.generation ?? null,
      rouging: preferences.rouging ?? null,
      tuberType: preferences.tuberType ?? null,
      grader: preferences.grader ?? null,
      incoming: preferences.incoming ?? { showCustomMarka: false },
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }
}
