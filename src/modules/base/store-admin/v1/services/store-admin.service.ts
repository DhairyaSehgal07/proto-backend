import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { StoreAdminDAO } from '../dao/store-admin.dao.js';
import type {
  CreateStoreAdminRequest,
  UpdateStoreAdminRequest,
  StoreAdminResponse,
  StoreAdminListResponse,
} from '../types/store-admin.js';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';

/**
 * Custom error classes for business logic
 */
export class StoreAdminNotFoundError extends Error {
  constructor(id: string) {
    super(`Store admin with id ${id} not found`);
    this.name = 'StoreAdminNotFoundError';
  }
}

export class StoreAdminValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreAdminValidationError';
  }
}

/**
 * Service layer for StoreAdmin
 * Contains business logic and orchestrates DAO operations
 */
export class StoreAdminService {
  private readonly dao: StoreAdminDAO;
  private readonly fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.dao = new StoreAdminDAO(fastify);
  }

  /**
   * Get all store admins with pagination and optional search
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    coldStorageId?: string;
    role?: 'Admin' | 'Manager' | 'Assistant';
    isVerified?: boolean;
  }): Promise<StoreAdminListResponse> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause for search and filters
    const where: Prisma.StoreAdminWhereInput = {};

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { mobileNumber: { contains: options.search, mode: 'insensitive' } },
        { personalAddress: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.coldStorageId) {
      where.coldStorageId = options.coldStorageId;
    }

    if (options?.role) {
      where.role = options.role;
    }

    if (options?.isVerified !== undefined) {
      where.isVerified = options.isVerified;
    }

    const [storeAdmins, count] = await Promise.all([
      this.dao.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.dao.count(where),
    ]);

    return {
      data: storeAdmins.map((admin) => this.mapToResponse(admin)),
      count,
    };
  }

  /**
   * Get a single store admin by ID
   */
  async getById(id: string): Promise<StoreAdminResponse> {
    const storeAdmin = await this.dao.findById(id);

    if (!storeAdmin) {
      throw new StoreAdminNotFoundError(id);
    }

    return this.mapToResponse(storeAdmin);
  }

  /**
   * Create a new store admin
   */
  async create(data: CreateStoreAdminRequest): Promise<StoreAdminResponse> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new StoreAdminValidationError('Name is required and cannot be empty');
    }

    if (data.name.length < 2) {
      throw new StoreAdminValidationError('Name must be at least 2 characters long');
    }

    if (!data.mobileNumber || !/^[0-9]{10}$/.test(data.mobileNumber)) {
      throw new StoreAdminValidationError('Mobile number must be exactly 10 digits');
    }

    if (!data.password || data.password.length < 6) {
      throw new StoreAdminValidationError('Password must be at least 6 characters long');
    }

    if (!data.coldStorageId) {
      throw new StoreAdminValidationError('Cold storage ID is required');
    }

    // Check if mobile number already exists for this cold storage
    const existing = await this.dao.findAll({
      where: {
        mobileNumber: data.mobileNumber,
        coldStorageId: data.coldStorageId,
      },
      take: 1,
    });

    if (existing.length > 0) {
      throw new StoreAdminValidationError(
        'A store admin with this mobile number already exists for this cold storage'
      );
    }

    // Verify cold storage exists
    const coldStorage = await this.fastify.prisma.coldStorage.findUnique({
      where: { id: data.coldStorageId },
    });

    if (!coldStorage) {
      throw new StoreAdminValidationError('Cold storage not found');
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const storeAdmin = await this.dao.create({
      coldStorageId: data.coldStorageId,
      name: data.name.trim(),
      personalAddress: data.personalAddress?.trim() ?? null,
      mobileNumber: data.mobileNumber.trim(),
      password: hashedPassword,
      role: data.role ?? 'Manager',
      isVerified: data.isVerified ?? false,
    });

    return this.mapToResponse(storeAdmin);
  }

  /**
   * Update an existing store admin
   */
  async update(id: string, data: UpdateStoreAdminRequest): Promise<StoreAdminResponse> {
    // Check if store admin exists
    const existingStoreAdmin = await this.dao.findById(id);
    if (!existingStoreAdmin) {
      throw new StoreAdminNotFoundError(id);
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new StoreAdminValidationError('Name cannot be empty');
      }
      if (data.name.length < 2) {
        throw new StoreAdminValidationError('Name must be at least 2 characters long');
      }
    }

    // Validate mobile number if provided
    if (data.mobileNumber !== undefined) {
      if (!data.mobileNumber || !/^[0-9]{10}$/.test(data.mobileNumber)) {
        throw new StoreAdminValidationError('Mobile number must be exactly 10 digits');
      }

      // Check if mobile number is already used by another store admin in the same cold storage
      const existing = await this.dao.findAll({
        where: {
          mobileNumber: data.mobileNumber,
          coldStorageId: existingStoreAdmin.coldStorageId,
          id: { not: id },
        },
        take: 1,
      });

      if (existing.length > 0) {
        throw new StoreAdminValidationError(
          'A store admin with this mobile number already exists for this cold storage'
        );
      }
    }

    // Validate password if provided
    if (data.password !== undefined && data.password.length < 6) {
      throw new StoreAdminValidationError('Password must be at least 6 characters long');
    }

    // Hash the password if provided
    const updateData: UpdateStoreAdminRequest = {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.personalAddress !== undefined && {
        personalAddress: data.personalAddress?.trim() ?? null,
      }),
      ...(data.mobileNumber !== undefined && { mobileNumber: data.mobileNumber.trim() }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
    };

    // Hash password if provided
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const storeAdmin = await this.dao.update(id, updateData);

    return this.mapToResponse(storeAdmin);
  }

  /**
   * Delete a store admin by ID
   */
  async delete(id: string): Promise<void> {
    // Check if store admin exists
    const existingStoreAdmin = await this.dao.findById(id);
    if (!existingStoreAdmin) {
      throw new StoreAdminNotFoundError(id);
    }

    await this.dao.delete(id);
  }

  /**
   * Map database model to response DTO (excludes password)
   */
  private mapToResponse(
    storeAdmin: PrismaTypes.StoreAdminGetPayload<{
      include: { coldStorage: true };
    }>
  ): StoreAdminResponse {
    return {
      id: storeAdmin.id,
      coldStorageId: storeAdmin.coldStorageId,
      name: storeAdmin.name,
      personalAddress: storeAdmin.personalAddress,
      mobileNumber: storeAdmin.mobileNumber,
      role: storeAdmin.role,
      isVerified: storeAdmin.isVerified,
      createdAt: storeAdmin.createdAt,
      updatedAt: storeAdmin.updatedAt,
    };
  }
}
