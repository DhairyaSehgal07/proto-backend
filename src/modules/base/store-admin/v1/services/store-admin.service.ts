import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { StoreAdminDAO } from '../dao/store-admin.dao.js';
import type {
  CreateStoreAdminRequest,
  UpdateStoreAdminRequest,
  StoreAdminResponse,
  StoreAdminListResponse,
  LoginStoreAdminRequest,
  LoginStoreAdminResponse,
  RegisterFarmerRequest,
  RegisterFarmerResponse,
} from '../types/store-admin.js';
import { Prisma, type Prisma as PrismaTypes } from '../../../../../../generated/prisma/client.js';
import type { JWTPayload } from '@/core/middleware/auth.middleware.js';

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
   * Login store admin
   */
  async login(
    data: LoginStoreAdminRequest,
    fastify: FastifyInstance
  ): Promise<LoginStoreAdminResponse> {
    // Validate mobile number
    if (!data.mobileNumber || !/^[0-9]{10}$/.test(data.mobileNumber)) {
      throw new StoreAdminValidationError('Mobile number must be exactly 10 digits');
    }

    if (!data.password || data.password.length === 0) {
      throw new StoreAdminValidationError('Password is required');
    }

    // Find admin by mobile number only (mobileNumber is unique across all cold storages)
    const storeAdmin = await this.dao.findByMobileNumber(data.mobileNumber);

    if (!storeAdmin) {
      throw new StoreAdminValidationError('Invalid mobile number or password');
    }

    // Check if account is verified
    if (!storeAdmin.isVerified) {
      throw new StoreAdminValidationError(
        'Admin account is not verified. Please contact administrator.'
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, storeAdmin.password);

    if (!isPasswordValid) {
      throw new StoreAdminValidationError('Invalid mobile number or password');
    }

    // Generate JWT token
    const payload: JWTPayload = {
      adminId: storeAdmin.id,
      adminName: storeAdmin.name,
      coldStorageId: storeAdmin.coldStorageId,
      coldStorageImageUrl: storeAdmin.coldStorage.imageUrl,
      role: storeAdmin.role,
    };

    const token = fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return {
      admin: this.mapToResponse(storeAdmin),
      token,
    };
  }

  /**
   * Register a farmer and link to cold storage
   */
  async registerFarmer(
    data: RegisterFarmerRequest,
    adminId: string,
    coldStorageId: string
  ): Promise<RegisterFarmerResponse> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new StoreAdminValidationError('Name is required and cannot be empty');
    }

    if (data.name.length < 2) {
      throw new StoreAdminValidationError('Name must be at least 2 characters long');
    }

    if (!data.address || data.address.trim().length === 0) {
      throw new StoreAdminValidationError('Address is required and cannot be empty');
    }

    if (data.address.length < 5) {
      throw new StoreAdminValidationError('Address must be at least 5 characters long');
    }

    if (!data.mobileNumber || !/^[0-9]{10}$/.test(data.mobileNumber)) {
      throw new StoreAdminValidationError('Mobile number must be exactly 10 digits');
    }

    if (!data.accountNumber || data.accountNumber < 1) {
      throw new StoreAdminValidationError('Account number is required and must be at least 1');
    }

    // Verify admin exists and has cold storage
    const admin = await this.dao.findById(adminId);
    if (!admin || !admin.coldStorage) {
      throw new StoreAdminValidationError('Missing cold storage context');
    }

    if (admin.coldStorageId !== coldStorageId) {
      throw new StoreAdminValidationError('Cold storage mismatch');
    }

    // Step 1: Check if farmer already exists (by mobile number)
    let farmer = await this.fastify.prisma.farmer.findUnique({
      where: { mobileNumber: data.mobileNumber },
    });

    if (!farmer) {
      // Create new farmer if not found
      // Generate default password "123456" and hash it
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const imageUrl = data.imageUrl?.trim();
      farmer = await this.fastify.prisma.farmer.create({
        data: {
          name: data.name.trim(),
          address: data.address.trim(),
          mobileNumber: data.mobileNumber.trim(),
          imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : null,
          password: hashedPassword,
        },
      });
    }

    // Step 2: Check if this farmer is already linked to this cold storage
    const existingLink = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: {
        farmerId_coldStorageId: {
          farmerId: farmer.id,
          coldStorageId: coldStorageId,
        },
      },
    });

    if (existingLink) {
      throw new StoreAdminValidationError('Farmer already registered with this cold storage');
    }

    // Step 3: Check if account number is already used in this cold storage
    const existingAccountNumber = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: {
        coldStorageId_accountNumber: {
          coldStorageId: coldStorageId,
          accountNumber: data.accountNumber,
        },
      },
    });

    if (existingAccountNumber) {
      throw new StoreAdminValidationError('Account number already exists for this cold storage');
    }

    // Step 4: Create the new FarmerStorageLink
    const link = await this.fastify.prisma.farmerStorageLink.create({
      data: {
        farmerId: farmer.id,
        coldStorageId: coldStorageId,
        linkedById: adminId,
        accountNumber: data.accountNumber,
        notes: data.notes?.trim() ?? null,
        isActive: true,
      },
    });

    return {
      farmer: {
        id: farmer.id,
        name: farmer.name,
        address: farmer.address,
        mobileNumber: farmer.mobileNumber,
        imageUrl: farmer.imageUrl,
        createdAt: farmer.createdAt,
        updatedAt: farmer.updatedAt,
      },
      link: {
        id: link.id,
        farmerId: link.farmerId,
        coldStorageId: link.coldStorageId,
        linkedById: link.linkedById,
        accountNumber: link.accountNumber.toString(),
        isActive: link.isActive,
        notes: link.notes,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
    };
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
