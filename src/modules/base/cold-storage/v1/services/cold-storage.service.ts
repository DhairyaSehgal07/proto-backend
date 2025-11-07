import type { FastifyInstance } from 'fastify';
import { ColdStorageDAO } from '../dao/cold-storage.dao.js';
import type {
  CreateColdStorageRequest,
  UpdateColdStorageRequest,
  ColdStorageResponse,
  ColdStorageListResponse,
  Preferences,
} from '../types/cold-storage.js';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';

/**
 * Custom error classes for business logic
 */
export class ColdStorageNotFoundError extends Error {
  constructor(id: string) {
    super(`Cold storage with id ${id} not found`);
    this.name = 'ColdStorageNotFoundError';
  }
}

export class ColdStorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ColdStorageValidationError';
  }
}

/**
 * Service layer for ColdStorage
 * Contains business logic and orchestrates DAO operations
 */
export class ColdStorageService {
  private readonly dao: ColdStorageDAO;

  constructor(fastify: FastifyInstance) {
    this.dao = new ColdStorageDAO(fastify);
  }

  /**
   * Get all cold storages with pagination and optional search
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    plan?: 'Basic' | 'Pro' | 'Enterprise';
  }): Promise<ColdStorageListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause for search and filters
    const where: Prisma.ColdStorageWhereInput = {};

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { address: { contains: options.search, mode: 'insensitive' } },
        { mobileNumber: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.plan) {
      where.plan = options.plan;
    }

    const [coldStorages, count] = await Promise.all([
      this.dao.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.dao.count(where),
    ]);

    return {
      data: coldStorages.map((storage) => this.mapToResponse(storage)),
      count,
    };
  }

  /**
   * Get a single cold storage by ID
   */
  async getById(id: string): Promise<ColdStorageResponse> {
    const coldStorage = await this.dao.findById(id);

    if (!coldStorage) {
      throw new ColdStorageNotFoundError(id);
    }

    return this.mapToResponse(coldStorage);
  }

  /**
   * Create a new cold storage
   */
  async create(data: CreateColdStorageRequest): Promise<ColdStorageResponse> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ColdStorageValidationError('Name is required and cannot be empty');
    }

    if (data.name.length < 2) {
      throw new ColdStorageValidationError('Name must be at least 2 characters long');
    }

    if (!data.address || data.address.trim().length === 0) {
      throw new ColdStorageValidationError('Address is required and cannot be empty');
    }

    if (!data.mobileNumber || !/^[0-9]{10}$/.test(data.mobileNumber)) {
      throw new ColdStorageValidationError('Mobile number must be exactly 10 digits');
    }

    if (!data.capacity || data.capacity <= 0) {
      throw new ColdStorageValidationError('Capacity must be a positive number');
    }

    // Check if mobile number already exists
    const existing = await this.dao.findAll({
      where: { mobileNumber: data.mobileNumber },
      take: 1,
    });

    if (existing.length > 0) {
      throw new ColdStorageValidationError('A cold storage with this mobile number already exists');
    }

    const coldStorage = await this.dao.create({
      name: data.name.trim(),
      address: data.address.trim(),
      mobileNumber: data.mobileNumber.trim(),
      capacity: data.capacity,
      imageUrl: data.imageUrl,
      isPaid: data.isPaid ?? false,
      isActive: data.isActive ?? true,
      plan: data.plan ?? 'Basic',
      preferences: data.preferences,
    });

    return this.mapToResponse(coldStorage);
  }

  /**
   * Update an existing cold storage
   */
  async update(id: string, data: UpdateColdStorageRequest): Promise<ColdStorageResponse> {
    // Check if cold storage exists
    const existingColdStorage = await this.dao.findById(id);
    if (!existingColdStorage) {
      throw new ColdStorageNotFoundError(id);
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new ColdStorageValidationError('Name cannot be empty');
      }
      if (data.name.length < 2) {
        throw new ColdStorageValidationError('Name must be at least 2 characters long');
      }
    }

    // Validate address if provided
    if (data.address !== undefined && (!data.address || data.address.trim().length === 0)) {
      throw new ColdStorageValidationError('Address cannot be empty');
    }

    // Validate mobile number if provided
    if (data.mobileNumber !== undefined) {
      if (!data.mobileNumber || !/^[0-9]{10}$/.test(data.mobileNumber)) {
        throw new ColdStorageValidationError('Mobile number must be exactly 10 digits');
      }

      // Check if mobile number is already used by another cold storage
      const existing = await this.dao.findAll({
        where: {
          mobileNumber: data.mobileNumber,
          id: { not: id },
        },
        take: 1,
      });

      if (existing.length > 0) {
        throw new ColdStorageValidationError(
          'A cold storage with this mobile number already exists'
        );
      }
    }

    // Validate capacity if provided
    if (data.capacity !== undefined && data.capacity <= 0) {
      throw new ColdStorageValidationError('Capacity must be a positive number');
    }

    const coldStorage = await this.dao.update(id, {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.address !== undefined && { address: data.address.trim() }),
      ...(data.mobileNumber !== undefined && { mobileNumber: data.mobileNumber.trim() }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.plan !== undefined && { plan: data.plan }),
      ...(data.preferences !== undefined && { preferences: data.preferences }),
    });

    return this.mapToResponse(coldStorage);
  }

  /**
   * Delete a cold storage by ID
   */
  async delete(id: string): Promise<void> {
    // Check if cold storage exists
    const existingColdStorage = await this.dao.findById(id);
    if (!existingColdStorage) {
      throw new ColdStorageNotFoundError(id);
    }

    await this.dao.delete(id);
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(
    coldStorage: PrismaTypes.ColdStorageGetPayload<{
      include: { preferences: true };
    }>
  ): ColdStorageResponse {
    // Map preferences, excluding internal fields (id, createdAt, updatedAt)
    // Always include preferences field, even if null
    const preferences: Preferences | null = coldStorage.preferences
      ? {
          bagSizes: coldStorage.preferences.bagSizes ?? [],
          commodities: coldStorage.preferences.commodities ?? [],
          generation: coldStorage.preferences.generation ?? null,
          rouging: coldStorage.preferences.rouging ?? null,
          tuberType: coldStorage.preferences.tuberType ?? null,
          grader: coldStorage.preferences.grader ?? null,
        }
      : null;

    const response: ColdStorageResponse = {
      id: coldStorage.id,
      name: coldStorage.name,
      address: coldStorage.address,
      mobileNumber: coldStorage.mobileNumber,
      capacity: coldStorage.capacity,
      imageUrl: coldStorage.imageUrl,
      isPaid: coldStorage.isPaid,
      isActive: coldStorage.isActive,
      plan: coldStorage.plan,
      preferences, // Explicitly include preferences field
      createdAt: coldStorage.createdAt,
      updatedAt: coldStorage.updatedAt,
    };

    return response;
  }
}
