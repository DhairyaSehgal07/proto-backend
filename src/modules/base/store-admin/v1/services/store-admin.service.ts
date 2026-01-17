import type { FastifyInstance, FastifyRequest } from 'fastify';
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
  ColdStorageResponse,
  Preferences,
  DaybookResponse,
  DaybookOrderItem,
  FarmersListResponse,
  FarmerResponse,
  GatePassNumberResponse,
  FarmerOrdersResponse,
  FarmerDetailResponse,
  VarietyInventoryAnalysisResponse,
} from '../types/store-admin.js';
import {
  Prisma,
  type Prisma as PrismaTypes,
  Commodity,
} from '../../../../../../generated/prisma/client.js';
import type { JWTPayload } from '@/core/middleware/auth.middleware.js';
import {
  validatePassword,
  validateMobileNumber,
  getClientIp,
  getDeviceInfo,
  ACCOUNT_LOCKOUT_CONFIG,
} from '@/utils/security.utils.js';
import { getNextGatePassNumber } from './helpers.js';

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

    // Validate mobile number with country code
    const mobileValidation = validateMobileNumber(data.mobileNumber);
    if (!mobileValidation.isValid) {
      throw new StoreAdminValidationError(mobileValidation.error || 'Invalid mobile number format');
    }

    // Normalize mobile number (remove country code) - database stores without country code
    const normalizedMobileNumber =
      mobileValidation.number || data.mobileNumber.replace(/^\+\d{1,3}/, '');

    // Validate password complexity
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new StoreAdminValidationError(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`
      );
    }

    if (!data.coldStorageId) {
      throw new StoreAdminValidationError('Cold storage ID is required');
    }

    // Check if mobile number already exists for this cold storage (use normalized number)
    const existing = await this.dao.findAll({
      where: {
        mobileNumber: normalizedMobileNumber,
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
      mobileNumber: normalizedMobileNumber.trim(),
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
    let normalizedMobileNumber: string | undefined;
    if (data.mobileNumber !== undefined) {
      // Check if it's already a 10-digit number (without country code)
      const isTenDigits = /^[0-9]{10}$/.test(data.mobileNumber);

      if (isTenDigits) {
        // Already in the correct format (10 digits), use it directly
        normalizedMobileNumber = data.mobileNumber;
      } else {
        // Validate mobile number with country code
        const mobileValidation = validateMobileNumber(data.mobileNumber);
        if (!mobileValidation.isValid) {
          throw new StoreAdminValidationError(
            mobileValidation.error || 'Invalid mobile number format'
          );
        }

        // Normalize mobile number (remove country code) - database stores without country code
        normalizedMobileNumber =
          mobileValidation.number || data.mobileNumber.replace(/^\+\d{1,3}/, '');
      }

      // Check if mobile number is already used by another store admin in the same cold storage (use normalized number)
      const existing = await this.dao.findAll({
        where: {
          mobileNumber: normalizedMobileNumber,
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
    if (data.password !== undefined) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new StoreAdminValidationError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`
        );
      }
    }

    // Hash the password if provided
    const updateData: UpdateStoreAdminRequest = {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.personalAddress !== undefined && {
        personalAddress: data.personalAddress?.trim() ?? null,
      }),
      ...(normalizedMobileNumber !== undefined && { mobileNumber: normalizedMobileNumber.trim() }),
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
   * Login store admin with security features:
   * - Account lockout after failed attempts
   * - Login audit trail
   * - Single JWT token (7 days expiry)
   * - Rate limiting (handled by middleware)
   */
  async login(
    data: LoginStoreAdminRequest,
    fastify: FastifyInstance,
    request?: FastifyRequest
  ): Promise<LoginStoreAdminResponse> {
    const ipAddress = request ? getClientIp(request) : 'unknown';
    const deviceInfo = request ? getDeviceInfo(request) : 'unknown';

    // Normalize mobile number for database lookup
    // Support both formats: with country code (+919877741375) and without (9877741375)
    let normalizedMobileNumber: string = data.mobileNumber;
    const mobileValidation = validateMobileNumber(data.mobileNumber);

    // If validation fails, try to handle old format (10 digits without country code)
    if (!mobileValidation.isValid) {
      // Check if it's the old 10-digit format
      if (/^[0-9]{10}$/.test(data.mobileNumber)) {
        // Old format - use as is for backward compatibility
        normalizedMobileNumber = data.mobileNumber;
      } else {
        // Invalid format
        await this.logLoginAttempt(
          data.mobileNumber,
          null,
          false,
          ipAddress,
          deviceInfo,
          mobileValidation.error
        );
        throw new StoreAdminValidationError(
          mobileValidation.error ||
            'Invalid mobile number format. Use +[country code][number] or 10 digits'
        );
      }
    } else {
      // New format with country code - extract just the number part for database lookup
      // Database stores numbers without country code, so we need to search for just the number
      // For Indian numbers: +91XXXXXXXXXX -> XXXXXXXXXX (10 digits)
      normalizedMobileNumber =
        mobileValidation.number || data.mobileNumber.replace(/^\+\d{1,3}/, '');

      // Ensure we have a valid number (should be 10 digits for Indian numbers)
      if (!normalizedMobileNumber || normalizedMobileNumber.length < 7) {
        await this.logLoginAttempt(
          data.mobileNumber,
          null,
          false,
          ipAddress,
          deviceInfo,
          'Failed to extract mobile number from country code format'
        );
        throw new StoreAdminValidationError(
          mobileValidation.error || 'Invalid mobile number format'
        );
      }
    }

    if (!data.password || data.password.length === 0) {
      throw new StoreAdminValidationError('Password is required');
    }

    // Log the normalized number for debugging (remove in production)
    fastify.log.debug(
      { original: data.mobileNumber, normalized: normalizedMobileNumber },
      'Mobile number normalization'
    );

    // Find admin by mobile number (database stores without country code)
    const storeAdmin = await this.dao.findByMobileNumber(normalizedMobileNumber);

    // Check account lockout
    if (storeAdmin) {
      const now = new Date();
      if (storeAdmin.lockedUntil && storeAdmin.lockedUntil > now) {
        const minutesRemaining = Math.ceil(
          (storeAdmin.lockedUntil.getTime() - now.getTime()) / 60000
        );
        await this.logLoginAttempt(
          normalizedMobileNumber,
          storeAdmin.id,
          false,
          ipAddress,
          deviceInfo,
          `Account locked. Try again in ${minutesRemaining} minutes`
        );
        throw new StoreAdminValidationError(
          `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minutes.`
        );
      }
    }

    // Check if account exists and is verified
    if (!storeAdmin) {
      await this.logLoginAttempt(
        normalizedMobileNumber,
        null,
        false,
        ipAddress,
        deviceInfo,
        'Invalid credentials'
      );
      throw new StoreAdminValidationError('Invalid mobile number or password');
    }

    if (!storeAdmin.isVerified) {
      await this.logLoginAttempt(
        normalizedMobileNumber,
        storeAdmin.id,
        false,
        ipAddress,
        deviceInfo,
        'Account not verified'
      );
      throw new StoreAdminValidationError(
        'Admin account is not verified. Please contact administrator.'
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, storeAdmin.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (storeAdmin.failedLoginAttempts || 0) + 1;
      const shouldLock = newFailedAttempts >= ACCOUNT_LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS;

      const updateData: Prisma.StoreAdminUpdateInput = {
        failedLoginAttempts: newFailedAttempts,
        ...(shouldLock && {
          lockedUntil: new Date(
            Date.now() + ACCOUNT_LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000
          ),
        }),
      };

      await this.fastify.prisma.storeAdmin.update({
        where: { id: storeAdmin.id },
        data: updateData,
      });

      await this.logLoginAttempt(
        normalizedMobileNumber,
        storeAdmin.id,
        false,
        ipAddress,
        deviceInfo,
        'Invalid password'
      );

      if (shouldLock) {
        throw new StoreAdminValidationError(
          `Account has been temporarily locked due to ${ACCOUNT_LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS} failed login attempts. Please try again in ${ACCOUNT_LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES} minutes.`
        );
      }

      throw new StoreAdminValidationError('Invalid mobile number or password');
    }

    // Successful login - reset failed attempts and unlock account
    await this.fastify.prisma.storeAdmin.update({
      where: { id: storeAdmin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Generate single JWT token with 7 days expiry
    const tokenPayload: JWTPayload = {
      adminId: storeAdmin.id,
      role: storeAdmin.role,
    };

    const token = fastify.jwt.sign(tokenPayload, {
      expiresIn: '7d', // 7 days
    });

    // Log successful login
    await this.logLoginAttempt(normalizedMobileNumber, storeAdmin.id, true, ipAddress, deviceInfo);

    return {
      admin: this.mapToResponse(storeAdmin),
      coldStorage: this.mapColdStorageToResponse(storeAdmin.coldStorage),
      token,
    };
  }

  /**
   * Logout - no database cleanup needed with single token approach
   */
  async logout(): Promise<void> {
    // With single JWT token in cookie, logout is handled by clearing the cookie
    // No database cleanup needed
    return Promise.resolve();
  }

  /**
   * Log login attempt for audit trail
   * TEMPORARILY DISABLED - Commented out to skip adding documents to loginAudit
   */
  private async logLoginAttempt(
    _mobileNumber: string,
    _adminId: string | null,
    _success: boolean,
    _ipAddress: string,
    _deviceInfo: string,
    _failureReason?: string
  ): Promise<void> {
    // TEMPORARILY DISABLED - Commented out to skip adding documents to loginAudit
    // try {
    //   await this.fastify.prisma.loginAudit.create({
    //     data: {
    //       adminId: _adminId,
    //       mobileNumber: _mobileNumber,
    //       success: _success,
    //       ipAddress: _ipAddress,
    //       deviceInfo: _deviceInfo,
    //       failureReason: _success ? null : _failureReason || null,
    //     },
    //   });
    // } catch (error) {
    //   // Log error but don't fail the login process
    //   this.fastify.log.error(error, 'Failed to log login attempt');
    // }
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
      include: {
        paymentHistory: true,
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
        paymentHistory: link.paymentHistory.map((payment) => ({
          id: payment.id,
          date: payment.date,
          amount: payment.amount,
          type: payment.type,
          remarks: payment.remarks,
          createdBy: payment.createdBy,
          voucherId: payment.voucherId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })),
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

  /**
   * Map cold storage database model to response DTO with preferences
   */
  private mapColdStorageToResponse(
    coldStorage: PrismaTypes.ColdStorageGetPayload<{
      include: { preferences: true };
    }>
  ): ColdStorageResponse {
    // Map preferences, including id (MongoDB ObjectId)
    const preferences: Preferences | null = coldStorage.preferences
      ? {
          id: coldStorage.preferences.id,
          commodities: coldStorage.preferences.commodities ?? [],
          generation: coldStorage.preferences.generation ?? null,
          rouging: coldStorage.preferences.rouging ?? null,
          tuberType: coldStorage.preferences.tuberType ?? null,
          grader: coldStorage.preferences.grader ?? null,
          incoming: coldStorage.preferences.incoming ?? {
            showCustomMarka: false,
          },
          customFields:
            coldStorage.preferences.customFields &&
            typeof coldStorage.preferences.customFields === 'object' &&
            !Array.isArray(coldStorage.preferences.customFields)
              ? (coldStorage.preferences.customFields as Record<string, unknown>)
              : null,
        }
      : null;

    return {
      id: coldStorage.id,
      name: coldStorage.name,
      address: coldStorage.address,
      mobileNumber: coldStorage.mobileNumber,
      capacity: coldStorage.capacity,
      imageUrl: coldStorage.imageUrl,
      isPaid: coldStorage.isPaid,
      isActive: coldStorage.isActive,
      plan: coldStorage.plan,
      preferences,
      createdAt: coldStorage.createdAt,
      updatedAt: coldStorage.updatedAt,
    };
  }

  /**
   * Get daybook orders (incoming and outgoing) for a cold storage
   * OPTIMIZED for high-frequency reads - uses direct Prisma queries, database-level sorting/pagination
   * Supports filtering by type, commodity, search, sorting, and pagination
   */
  async getDaybook(
    coldStorageId: string,
    options?: {
      type?: 'all' | 'incoming' | 'outgoing';
      commodity?: string;
      search?: string;
      sortBy?: 'latest' | 'oldest';
      page?: number;
      limit?: number;
    }
  ): Promise<DaybookResponse> {
    const type = options?.type ?? 'all';
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const sortBy = options?.sortBy ?? 'latest';
    const orderBy = sortBy === 'latest' ? 'desc' : 'asc';

    // Build common where clause
    const buildWhere = () => {
      const where: Prisma.IncomingOrderWhereInput | Prisma.OutgoingOrderWhereInput = {
        coldStorageId,
      };

      if (options?.commodity) {
        where.commodity = options.commodity as Commodity;
      }

      if (options?.search) {
        const gatePassNumber = parseInt(options.search, 10);
        if (!isNaN(gatePassNumber)) {
          where.gatePassNumber = gatePassNumber;
        }
      }

      return where;
    };

    // Helper function to create pagination metadata
    const createPaginationMeta = (total: number, currentPage: number, itemsPerPage: number) => {
      const totalPages = Math.ceil(total / itemsPerPage);
      return {
        currentPage,
        totalPages,
        totalItems: total,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        previousPage: currentPage > 1 ? currentPage - 1 : null,
      };
    };

    // Helper function to enrich orders with location data (batch fetch)
    const enrichOrdersWithLocations = async <
      T extends { varieties?: Array<{ bagSizes?: Array<{ locationId: string }> }> },
    >(
      orders: T[]
    ): Promise<T[]> => {
      // Collect all location IDs
      const locationIds = new Set<string>();
      orders.forEach((order) => {
        if (order.varieties) {
          order.varieties.forEach((variety) => {
            if (variety.bagSizes) {
              variety.bagSizes.forEach((bag) => {
                if (bag.locationId) {
                  locationIds.add(bag.locationId);
                }
              });
            }
          });
        }
      });

      if (locationIds.size === 0) {
        return orders;
      }

      // Batch fetch all locations
      const locations = await this.fastify.prisma.location.findMany({
        where: { id: { in: Array.from(locationIds) } },
        select: { id: true, floor: true, row: true, chamber: true },
      });

      const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

      // Enrich orders with location data
      return orders.map((order) => {
        if (!order.varieties) return order;
        return {
          ...order,
          varieties: order.varieties.map((variety) => ({
            ...variety,
            bagSizes: variety.bagSizes?.map((bag) => {
              const loc = locationMap.get(bag.locationId);
              return {
                ...bag,
                ...(loc ? { floor: loc.floor, row: loc.row, chamber: loc.chamber } : {}),
              };
            }),
          })),
        };
      });
    };

    // Helper function to enrich daybook orders with incoming order gatePass numbers
    const enrichDaybookOrdersWithIncomingGatePass = async (
      orders: DaybookOrderItem[]
    ): Promise<DaybookOrderItem[]> => {
      // Collect all incoming order IDs
      const incomingOrderIds = new Set<string>();
      orders.forEach((order) => {
        if (order.varieties) {
          order.varieties.forEach((variety) => {
            if (variety.bagSizes) {
              variety.bagSizes.forEach((bag) => {
                if (bag.incomingOrderId) {
                  // Only add if it looks like an ID (ObjectId format), not already a gatePass number
                  if (
                    bag.incomingOrderId.length === 24 &&
                    /^[0-9a-fA-F]{24}$/.test(bag.incomingOrderId)
                  ) {
                    incomingOrderIds.add(bag.incomingOrderId);
                  }
                }
              });
            }
          });
        }
      });

      if (incomingOrderIds.size === 0) {
        return orders;
      }

      // Batch fetch all incoming orders to get their gatePass numbers
      const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
        where: { id: { in: Array.from(incomingOrderIds) } },
        select: { id: true, gatePassNumber: true },
      });

      const gatePassMap = new Map(
        incomingOrders.map((io) => [io.id, io.gatePassNumber.toString()])
      );

      // Enrich orders with gatePass numbers (replace incomingOrderId with gatePass number)
      return orders.map((order) => {
        if (!order.varieties) return order;
        return {
          ...order,
          varieties: order.varieties.map((variety) => ({
            ...variety,
            bagSizes: variety.bagSizes?.map((bag) => {
              // If incomingOrderId is an ObjectId, replace with gatePass number
              if (
                bag.incomingOrderId &&
                bag.incomingOrderId.length === 24 &&
                /^[0-9a-fA-F]{24}$/.test(bag.incomingOrderId)
              ) {
                const gatePassNumber = gatePassMap.get(bag.incomingOrderId);
                return {
                  ...bag,
                  incomingOrderId: gatePassNumber ?? bag.incomingOrderId,
                };
              }
              // Already a gatePass number or undefined, keep as is
              return bag;
            }),
          })),
        };
      });
    };

    // Helper function to sort bag sizes by name (in-place for performance)
    const sortBagSizes = (orders: DaybookOrderItem[]) => {
      for (const order of orders) {
        if (order.varieties) {
          for (const variety of order.varieties) {
            if (variety.bagSizes) {
              variety.bagSizes.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
        }
      }
      return orders;
    };

    const enrichOrdersWithRentEntries = async (
      orders: DaybookOrderItem[]
    ): Promise<DaybookOrderItem[]> => {
      const orderIds = orders.map((order) => order.id);

      if (orderIds.length === 0) {
        return orders;
      }

      // Fetch payment entries for these vouchers (only one payment entry per voucher)
      const paymentEntries = await this.fastify.prisma.farmerPaymentHistory.findMany({
        where: {
          voucherId: { in: orderIds },
        },
        select: {
          id: true,
          date: true,
          amount: true,
          type: true,
          remarks: true,
          createdBy: true,
          voucherId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Map: voucherId -> payment entry (filter out null voucherIds)
      const paymentEntryMap = new Map(
        paymentEntries
          .filter(
            (entry): entry is typeof entry & { voucherId: string } => entry.voucherId !== null
          )
          .map((entry) => [entry.voucherId, entry])
      );

      return orders.map((order) => ({
        ...order,
        rentEntry: paymentEntryMap.get(order.id) ?? null,
      }));
    };

    // Common select for farmer storage link
    const farmerStorageLinkSelect = {
      id: true,
      accountNumber: true,
      farmer: {
        select: {
          id: true,
          name: true,
          address: true,
          mobileNumber: true,
          imageUrl: true,
        },
      },
    };

    switch (type) {
      case 'incoming': {
        const where = buildWhere() as Prisma.IncomingOrderWhereInput;
        const skip = (page - 1) * limit;

        // Fetch orders sorted by date (with createdAt as fallback for null dates)
        // Since date can be null, we'll sort in memory to use date ?? createdAt
        const [allOrdersForSort, count] = await Promise.all([
          this.fastify.prisma.incomingOrder.findMany({
            where,
            orderBy: [{ date: orderBy === 'desc' ? 'desc' : 'asc' }, { createdAt: orderBy }],
            select: {
              id: true,
              farmerStorageLinkId: true,
              coldStorageId: true,
              commodity: true,
              gatePassType: true,
              gatePassNumber: true,
              remarks: true,
              currentStockAtThatTime: true,
              varieties: true,
              date: true,
              createdAt: true,
              updatedAt: true,
              farmerStorageLink: {
                select: farmerStorageLinkSelect,
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          this.fastify.prisma.incomingOrder.count({ where }),
        ]);

        // Sort by date ?? createdAt and apply pagination
        const orders = allOrdersForSort
          .sort((a, b) => {
            const dateA = (a.date ?? a.createdAt).getTime();
            const dateB = (b.date ?? b.createdAt).getTime();
            return orderBy === 'desc' ? dateB - dateA : dateA - dateB;
          })
          .slice(skip, skip + limit);

        // Enrich with locations (batch fetch)
        const enrichedOrders = await enrichOrdersWithLocations(orders);

        const daybookOrders: DaybookOrderItem[] = enrichedOrders.map((order) => ({
          id: order.id,
          type: 'incoming' as const,
          farmerStorageLinkId: order.farmerStorageLinkId,
          coldStorageId: order.coldStorageId,
          commodity: order.commodity,
          gatePassType: order.gatePassType,
          date: order.date || order.createdAt,
          gatePassNumber: order.gatePassNumber,
          remarks: order.remarks,
          currentStockAtThatTime: order.currentStockAtThatTime,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          farmerStorageLink: order.farmerStorageLink
            ? {
                id: order.farmerStorageLink.id,
                accountNumber: order.farmerStorageLink.accountNumber,
                farmer: order.farmerStorageLink.farmer,
              }
            : undefined,
          createdBy: order.createdBy || undefined,
          varieties: order.varieties?.map((variety) => ({
            name: variety.name,
            bagSizes: variety.bagSizes?.map((bag) => ({
              name: bag.name,
              quantityInit: bag.quantityInit,
              quantityCurr: bag.quantityCurr,
              approxWeight: bag.approxWeight ?? undefined,
              customMarka: (bag as { customMarka?: string }).customMarka ?? undefined,
              locationId: bag.locationId,
              floor: (bag as { floor?: string }).floor,
              row: (bag as { row?: string }).row,
              chamber: (bag as { chamber?: string }).chamber,
            })),
          })),
        }));

        sortBagSizes(daybookOrders);

        // Enrich with rent entries
        const enrichedWithRentEntries = await enrichOrdersWithRentEntries(daybookOrders);

        return {
          data: enrichedWithRentEntries,
          pagination: createPaginationMeta(count, page, limit),
        };
      }

      case 'outgoing': {
        const where = buildWhere() as Prisma.OutgoingOrderWhereInput;
        const skip = (page - 1) * limit;

        // Fetch orders sorted by date (with createdAt as fallback for null dates)
        // Since date can be null, we'll sort in memory to use date ?? createdAt
        const [allOrdersForSort, count] = await Promise.all([
          this.fastify.prisma.outgoingOrder.findMany({
            where,
            orderBy: [{ date: orderBy === 'desc' ? 'desc' : 'asc' }, { createdAt: orderBy }],
            select: {
              id: true,
              farmerStorageLinkId: true,
              coldStorageId: true,
              commodity: true,
              gatePassType: true,
              gatePassNumber: true,
              remarks: true,
              currentStockAtThatTime: true,
              varieties: true,
              totalBags: true,
              totalWeight: true,
              date: true,
              createdAt: true,
              updatedAt: true,
              farmerStorageLink: {
                select: {
                  id: true,
                  farmer: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      mobileNumber: true,
                      imageUrl: true,
                    },
                  },
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          this.fastify.prisma.outgoingOrder.count({ where }),
        ]);

        // Sort by date ?? createdAt and apply pagination
        const orders = allOrdersForSort
          .sort((a, b) => {
            const dateA = (a.date ?? a.createdAt).getTime();
            const dateB = (b.date ?? b.createdAt).getTime();
            return orderBy === 'desc' ? dateB - dateA : dateA - dateB;
          })
          .slice(skip, skip + limit);

        // Enrich with locations (batch fetch)
        const enrichedOrders = await enrichOrdersWithLocations(orders);

        const daybookOrders: DaybookOrderItem[] = enrichedOrders.map((order) => ({
          id: order.id,
          type: 'outgoing' as const,
          farmerStorageLinkId: order.farmerStorageLinkId,
          coldStorageId: order.coldStorageId,
          date: order.date || order.createdAt,
          commodity: order.commodity,
          gatePassType: order.gatePassType,
          gatePassNumber: order.gatePassNumber,
          remarks: order.remarks,
          currentStockAtThatTime: order.currentStockAtThatTime,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          farmerStorageLink: order.farmerStorageLink
            ? {
                id: order.farmerStorageLink.id,
                farmer: order.farmerStorageLink.farmer,
              }
            : undefined,
          totalBags: order.totalBags,
          totalWeight: order.totalWeight,
          createdBy: order.createdBy || undefined,
          varieties: order.varieties?.map((variety) => ({
            name: variety.name,
            bagSizes: variety.bagSizes?.map((bag) => ({
              name: bag.name,
              quantityInit: bag.quantityBefore,
              quantityCurr: bag.quantityAfter,
              approxWeight: bag.approxWeight ?? undefined,
              locationId: bag.locationId,
              incomingOrderId: bag.incomingOrderId,
              floor: (bag as { floor?: string }).floor,
              row: (bag as { row?: string }).row,
              chamber: (bag as { chamber?: string }).chamber,
            })),
          })),
        }));

        // Enrich with incoming order gatePass numbers
        const enrichedDaybookOrders = await enrichDaybookOrdersWithIncomingGatePass(daybookOrders);

        // Sort bag sizes
        sortBagSizes(enrichedDaybookOrders);

        // Enrich with rent entries
        const enrichedWithRentEntries = await enrichOrdersWithRentEntries(enrichedDaybookOrders);

        return {
          data: enrichedWithRentEntries,
          pagination: createPaginationMeta(count, page, limit),
        };
      }

      case 'all': {
        // OPTIMIZED: Fetch a larger window (3x page size) from both tables, merge, sort, then paginate
        // This avoids fetching all records while still getting accurate merged results
        const fetchWindow = Math.max(limit * 3, 50); // At least 3 pages worth, minimum 50
        const where = buildWhere();

        const [incomingOrders, outgoingOrders, incomingCount, outgoingCount] = await Promise.all([
          this.fastify.prisma.incomingOrder.findMany({
            where: where as Prisma.IncomingOrderWhereInput,
            take: fetchWindow,
            orderBy: [{ date: orderBy === 'desc' ? 'desc' : 'asc' }, { createdAt: orderBy }],
            select: {
              id: true,
              farmerStorageLinkId: true,
              coldStorageId: true,
              commodity: true,
              gatePassType: true,
              gatePassNumber: true,
              remarks: true,
              currentStockAtThatTime: true,
              varieties: true,
              date: true,
              createdAt: true,
              updatedAt: true,
              farmerStorageLink: {
                select: farmerStorageLinkSelect,
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          this.fastify.prisma.outgoingOrder.findMany({
            where: where as Prisma.OutgoingOrderWhereInput,
            take: fetchWindow,
            orderBy: [{ date: orderBy === 'desc' ? 'desc' : 'asc' }, { createdAt: orderBy }],
            select: {
              id: true,
              farmerStorageLinkId: true,
              coldStorageId: true,
              commodity: true,
              gatePassType: true,
              gatePassNumber: true,
              remarks: true,
              currentStockAtThatTime: true,
              varieties: true,
              totalBags: true,
              totalWeight: true,
              date: true,
              createdAt: true,
              updatedAt: true,
              farmerStorageLink: {
                select: {
                  id: true,
                  farmer: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      mobileNumber: true,
                      imageUrl: true,
                    },
                  },
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          this.fastify.prisma.incomingOrder.count({
            where: where as Prisma.IncomingOrderWhereInput,
          }),
          this.fastify.prisma.outgoingOrder.count({
            where: where as Prisma.OutgoingOrderWhereInput,
          }),
        ]);

        const totalCount = incomingCount + outgoingCount;

        if (totalCount === 0) {
          return {
            data: [],
            pagination: createPaginationMeta(0, page, limit),
          };
        }

        // Merge and sort (using efficient merge for pre-sorted arrays)
        const allOrders: DaybookOrderItem[] = [];
        let incomingIdx = 0;
        let outgoingIdx = 0;

        // Merge two sorted arrays efficiently
        while (incomingIdx < incomingOrders.length || outgoingIdx < outgoingOrders.length) {
          const incomingOrder = incomingOrders[incomingIdx];
          const outgoingOrder = outgoingOrders[outgoingIdx];

          if (!incomingOrder) {
            allOrders.push({
              id: outgoingOrder.id,
              type: 'outgoing',
              farmerStorageLinkId: outgoingOrder.farmerStorageLinkId,
              coldStorageId: outgoingOrder.coldStorageId,
              commodity: outgoingOrder.commodity,
              gatePassType: outgoingOrder.gatePassType,
              date: outgoingOrder.date || outgoingOrder.createdAt,
              gatePassNumber: outgoingOrder.gatePassNumber,
              remarks: outgoingOrder.remarks,
              currentStockAtThatTime: outgoingOrder.currentStockAtThatTime,
              createdAt: outgoingOrder.createdAt,
              updatedAt: outgoingOrder.updatedAt,
              farmerStorageLink: outgoingOrder.farmerStorageLink
                ? {
                    id: outgoingOrder.farmerStorageLink.id,
                    farmer: outgoingOrder.farmerStorageLink.farmer,
                  }
                : undefined,
              totalBags: outgoingOrder.totalBags,
              totalWeight: outgoingOrder.totalWeight,
              createdBy: outgoingOrder.createdBy || undefined,
              varieties: outgoingOrder.varieties?.map((variety) => ({
                name: variety.name,
                bagSizes: variety.bagSizes?.map((bag) => ({
                  name: bag.name,
                  quantityInit: bag.quantityBefore,
                  quantityCurr: bag.quantityAfter,
                  approxWeight: bag.approxWeight ?? undefined,
                  locationId: bag.locationId,
                  incomingOrderId: bag.incomingOrderId,
                })),
              })),
            });
            outgoingIdx++;
          } else if (!outgoingOrder) {
            allOrders.push({
              id: incomingOrder.id,
              type: 'incoming',
              farmerStorageLinkId: incomingOrder.farmerStorageLinkId,
              coldStorageId: incomingOrder.coldStorageId,
              commodity: incomingOrder.commodity,
              gatePassType: incomingOrder.gatePassType,
              date: incomingOrder.date || incomingOrder.createdAt,
              gatePassNumber: incomingOrder.gatePassNumber,
              remarks: incomingOrder.remarks,
              currentStockAtThatTime: incomingOrder.currentStockAtThatTime,
              createdAt: incomingOrder.createdAt,
              updatedAt: incomingOrder.updatedAt,
              farmerStorageLink: incomingOrder.farmerStorageLink
                ? {
                    id: incomingOrder.farmerStorageLink.id,
                    accountNumber: incomingOrder.farmerStorageLink.accountNumber,
                    farmer: incomingOrder.farmerStorageLink.farmer,
                  }
                : undefined,
              createdBy: incomingOrder.createdBy || undefined,
              varieties: incomingOrder.varieties?.map((variety) => ({
                name: variety.name,
                bagSizes: variety.bagSizes?.map((bag) => ({
                  name: bag.name,
                  quantityInit: bag.quantityInit,
                  quantityCurr: bag.quantityCurr,
                  approxWeight: bag.approxWeight ?? undefined,
                  customMarka: (bag as { customMarka?: string }).customMarka ?? undefined,
                  locationId: bag.locationId,
                })),
              })),
            });
            incomingIdx++;
          } else {
            // Use date ?? createdAt for comparison
            const incomingTime = (incomingOrder.date ?? incomingOrder.createdAt).getTime();
            const outgoingTime = (outgoingOrder.date ?? outgoingOrder.createdAt).getTime();
            const compare =
              orderBy === 'desc' ? outgoingTime - incomingTime : incomingTime - outgoingTime;

            if (compare <= 0) {
              allOrders.push({
                id: incomingOrder.id,
                type: 'incoming',
                farmerStorageLinkId: incomingOrder.farmerStorageLinkId,
                coldStorageId: incomingOrder.coldStorageId,
                commodity: incomingOrder.commodity,
                gatePassType: incomingOrder.gatePassType,
                date: incomingOrder.date || incomingOrder.createdAt,
                gatePassNumber: incomingOrder.gatePassNumber,
                remarks: incomingOrder.remarks,
                currentStockAtThatTime: incomingOrder.currentStockAtThatTime,
                createdAt: incomingOrder.createdAt,
                updatedAt: incomingOrder.updatedAt,
                farmerStorageLink: incomingOrder.farmerStorageLink
                  ? {
                      id: incomingOrder.farmerStorageLink.id,
                      accountNumber: incomingOrder.farmerStorageLink.accountNumber,
                      farmer: incomingOrder.farmerStorageLink.farmer,
                    }
                  : undefined,
                createdBy: incomingOrder.createdBy || undefined,
                varieties: incomingOrder.varieties?.map((variety) => ({
                  name: variety.name,
                  bagSizes: variety.bagSizes?.map((bag) => ({
                    name: bag.name,
                    quantityInit: bag.quantityInit,
                    quantityCurr: bag.quantityCurr,
                    approxWeight: bag.approxWeight ?? undefined,
                    customMarka: (bag as { customMarka?: string }).customMarka ?? undefined,
                    locationId: bag.locationId,
                  })),
                })),
              });
              incomingIdx++;
            } else {
              allOrders.push({
                id: outgoingOrder.id,
                type: 'outgoing',
                farmerStorageLinkId: outgoingOrder.farmerStorageLinkId,
                coldStorageId: outgoingOrder.coldStorageId,
                commodity: outgoingOrder.commodity,
                gatePassType: outgoingOrder.gatePassType,
                date: outgoingOrder.date || outgoingOrder.createdAt,
                gatePassNumber: outgoingOrder.gatePassNumber,
                remarks: outgoingOrder.remarks,
                currentStockAtThatTime: outgoingOrder.currentStockAtThatTime,
                createdAt: outgoingOrder.createdAt,
                updatedAt: outgoingOrder.updatedAt,
                farmerStorageLink: outgoingOrder.farmerStorageLink
                  ? {
                      id: outgoingOrder.farmerStorageLink.id,
                      farmer: outgoingOrder.farmerStorageLink.farmer,
                    }
                  : undefined,
                totalBags: outgoingOrder.totalBags,
                totalWeight: outgoingOrder.totalWeight,
                createdBy: outgoingOrder.createdBy || undefined,
                varieties: outgoingOrder.varieties?.map((variety) => ({
                  name: variety.name,
                  bagSizes: variety.bagSizes?.map((bag) => ({
                    name: bag.name,
                    quantityInit: bag.quantityBefore,
                    quantityCurr: bag.quantityAfter,
                    approxWeight: bag.approxWeight ?? undefined,
                    locationId: bag.locationId,
                    incomingOrderId: bag.incomingOrderId,
                  })),
                })),
              });
              outgoingIdx++;
            }
          }

          // Stop if we have enough for pagination
          if (allOrders.length >= fetchWindow) {
            break;
          }
        }

        // Apply pagination
        const skip = (page - 1) * limit;
        const paginatedOrders = allOrders.slice(skip, skip + limit);

        // Enrich with locations (batch fetch)
        const enrichedOrders = await enrichOrdersWithLocations(paginatedOrders);

        // Enrich with incoming order gatePass numbers
        const enrichedDaybookOrders = await enrichDaybookOrdersWithIncomingGatePass(enrichedOrders);

        // Sort bag sizes
        sortBagSizes(enrichedDaybookOrders);

        // Enrich with rent entries
        const enrichedWithRentEntries = await enrichOrdersWithRentEntries(enrichedDaybookOrders);

        return {
          data: enrichedWithRentEntries,
          pagination: createPaginationMeta(totalCount, page, limit),
        };
      }

      default:
        throw new StoreAdminValidationError(
          "Invalid type parameter. Use 'all', 'incoming', or 'outgoing'."
        );
    }
  }

  /**
   * Get all farmers for a cold storage
   * Returns farmer storage links with farmer information and payment history populated
   */
  async getFarmers(coldStorageId: string): Promise<FarmersListResponse> {
    // Query all farmer storage links for this cold storage with farmer and payment history populated
    const links = await this.fastify.prisma.farmerStorageLink.findMany({
      where: {
        coldStorageId,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
            address: true,
          },
        },
        paymentHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to response format
    const data: FarmerResponse[] = links.map((link) => ({
      id: link.id,
      farmerId: link.farmer.id,
      name: link.farmer.name,
      mobileNumber: link.farmer.mobileNumber,
      address: link.farmer.address,
      accountNumber: link.accountNumber,
      isActive: link.isActive,
      paymentHistory: link.paymentHistory.map((payment) => ({
        id: payment.id,
        date: payment.date,
        amount: payment.amount,
        type: payment.type,
        remarks: payment.remarks,
        createdBy: payment.createdBy,
        voucherId: payment.voucherId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
    }));

    return { data };
  }

  /**
   * Get farmer details by farmerStorageLinkId
   * Returns farmerStorageLink document with populated farmerId (name, address, mobileNumber)
   * and populated linkedById (name and id of store admin)
   */
  async getFarmerById(
    farmerStorageLinkId: string,
    coldStorageId: string
  ): Promise<FarmerDetailResponse> {
    // Query farmer storage link with populated farmer and linkedBy
    const link = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: {
        id: farmerStorageLinkId,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            address: true,
            mobileNumber: true,
          },
        },
        linkedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!link) {
      throw new StoreAdminNotFoundError(farmerStorageLinkId);
    }

    // Verify the link belongs to the cold storage
    if (link.coldStorageId !== coldStorageId) {
      throw new StoreAdminValidationError(
        'Farmer storage link does not belong to this cold storage'
      );
    }

    return {
      id: link.id,
      farmerId: link.farmerId,
      coldStorageId: link.coldStorageId,
      accountNumber: link.accountNumber,
      isActive: link.isActive,
      notes: link.notes,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      farmer: {
        id: link.farmer.id,
        name: link.farmer.name,
        address: link.farmer.address,
        mobileNumber: link.farmer.mobileNumber,
      },
      linkedBy: link.linkedBy
        ? {
            id: link.linkedBy.id,
            name: link.linkedBy.name,
          }
        : null,
    };
  }

  /**
   * Get the next gate pass number for a given cold storage and commodity
   * Queries either incoming or outgoing orders based on the type parameter
   */
  async getNextGatePassNumber(
    coldStorageId: string,
    commodity: Commodity,
    type: 'incoming' | 'outgoing'
  ): Promise<GatePassNumberResponse> {
    const nextGatePassNumber = await getNextGatePassNumber(
      this.fastify,
      coldStorageId,
      commodity,
      type
    );

    return {
      nextGatePassNumber,
      commodity,
      coldStorageId,
      type,
    };
  }

  /**
   * Get all orders (incoming and outgoing) for a specific farmer
   * Similar to daybook but filtered by farmerStorageLinkId
   * No pagination - returns all orders
   */
  async getFarmerOrders(
    coldStorageId: string,
    farmerStorageLinkId: string,
    type: 'all' | 'incoming' | 'outgoing' = 'all'
  ): Promise<FarmerOrdersResponse> {
    // Verify farmer storage link belongs to cold storage
    const link = await this.fastify.prisma.farmerStorageLink.findUnique({
      where: { id: farmerStorageLinkId },
    });

    if (!link || link.coldStorageId !== coldStorageId) {
      throw new StoreAdminValidationError('Invalid farmer storage link');
    }

    // Helper function to enrich orders with location data (batch fetch)
    const enrichOrdersWithLocations = async <
      T extends { varieties?: Array<{ bagSizes?: Array<{ locationId: string }> }> },
    >(
      orders: T[]
    ): Promise<T[]> => {
      // Collect all location IDs
      const locationIds = new Set<string>();
      orders.forEach((order) => {
        if (order.varieties) {
          order.varieties.forEach((variety) => {
            if (variety.bagSizes) {
              variety.bagSizes.forEach((bag) => {
                if (bag.locationId) {
                  locationIds.add(bag.locationId);
                }
              });
            }
          });
        }
      });

      if (locationIds.size === 0) {
        return orders;
      }

      // Batch fetch all locations
      const locations = await this.fastify.prisma.location.findMany({
        where: { id: { in: Array.from(locationIds) } },
        select: { id: true, floor: true, row: true, chamber: true },
      });

      const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

      // Enrich orders with location data
      return orders.map((order) => {
        if (!order.varieties) return order;
        return {
          ...order,
          varieties: order.varieties.map((variety) => ({
            ...variety,
            bagSizes: variety.bagSizes?.map((bag) => {
              const loc = locationMap.get(bag.locationId);
              return {
                ...bag,
                ...(loc ? { floor: loc.floor, row: loc.row, chamber: loc.chamber } : {}),
              };
            }),
          })),
        };
      });
    };

    // Helper function to enrich daybook orders with incoming order gatePass numbers
    const enrichDaybookOrdersWithIncomingGatePass = async (
      orders: DaybookOrderItem[]
    ): Promise<DaybookOrderItem[]> => {
      // Collect all incoming order IDs
      const incomingOrderIds = new Set<string>();
      orders.forEach((order) => {
        if (order.varieties) {
          order.varieties.forEach((variety) => {
            if (variety.bagSizes) {
              variety.bagSizes.forEach((bag) => {
                if (bag.incomingOrderId) {
                  // Only add if it looks like an ID (ObjectId format), not already a gatePass number
                  if (
                    bag.incomingOrderId.length === 24 &&
                    /^[0-9a-fA-F]{24}$/.test(bag.incomingOrderId)
                  ) {
                    incomingOrderIds.add(bag.incomingOrderId);
                  }
                }
              });
            }
          });
        }
      });

      if (incomingOrderIds.size === 0) {
        return orders;
      }

      // Batch fetch all incoming orders to get their gatePass numbers
      const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
        where: { id: { in: Array.from(incomingOrderIds) } },
        select: { id: true, gatePassNumber: true },
      });

      const gatePassMap = new Map(
        incomingOrders.map((io) => [io.id, io.gatePassNumber.toString()])
      );

      // Enrich orders with gatePass numbers (replace incomingOrderId with gatePass number)
      return orders.map((order) => {
        if (!order.varieties) return order;
        return {
          ...order,
          varieties: order.varieties.map((variety) => ({
            ...variety,
            bagSizes: variety.bagSizes?.map((bag) => {
              // If incomingOrderId is an ObjectId, replace with gatePass number
              if (
                bag.incomingOrderId &&
                bag.incomingOrderId.length === 24 &&
                /^[0-9a-fA-F]{24}$/.test(bag.incomingOrderId)
              ) {
                const gatePassNumber = gatePassMap.get(bag.incomingOrderId);
                return {
                  ...bag,
                  incomingOrderId: gatePassNumber ?? bag.incomingOrderId,
                };
              }
              // Already a gatePass number or undefined, keep as is
              return bag;
            }),
          })),
        };
      });
    };

    // Helper function to sort bag sizes by name (in-place for performance)
    const sortBagSizes = (orders: DaybookOrderItem[]) => {
      for (const order of orders) {
        if (order.varieties) {
          for (const variety of order.varieties) {
            if (variety.bagSizes) {
              variety.bagSizes.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
        }
      }
      return orders;
    };

    // Common select for farmer storage link
    const farmerStorageLinkSelect = {
      id: true,
      accountNumber: true,
      farmer: {
        select: {
          id: true,
          name: true,
          address: true,
          mobileNumber: true,
          imageUrl: true,
        },
      },
    };

    const where: Prisma.IncomingOrderWhereInput | Prisma.OutgoingOrderWhereInput = {
      coldStorageId,
      farmerStorageLinkId,
    };

    switch (type) {
      case 'incoming': {
        const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
          where: where as Prisma.IncomingOrderWhereInput,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            farmerStorageLinkId: true,
            coldStorageId: true,
            commodity: true,
            gatePassType: true,
            gatePassNumber: true,
            remarks: true,
            currentStockAtThatTime: true,
            varieties: true,
            date: true,
            createdAt: true,
            updatedAt: true,
            farmerStorageLink: {
              select: farmerStorageLinkSelect,
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Sort by date ?? createdAt
        const sortedOrders = incomingOrders.sort((a, b) => {
          const dateA = (a.date ?? a.createdAt).getTime();
          const dateB = (b.date ?? b.createdAt).getTime();
          return dateB - dateA;
        });

        // Enrich with locations
        const enrichedOrders = await enrichOrdersWithLocations(sortedOrders);

        const daybookOrders: DaybookOrderItem[] = enrichedOrders.map((order) => ({
          id: order.id,
          type: 'incoming' as const,
          farmerStorageLinkId: order.farmerStorageLinkId,
          coldStorageId: order.coldStorageId,
          commodity: order.commodity,
          gatePassType: order.gatePassType,
          date: order.date || order.createdAt,
          gatePassNumber: order.gatePassNumber,
          remarks: order.remarks,
          currentStockAtThatTime: order.currentStockAtThatTime,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          farmerStorageLink: order.farmerStorageLink
            ? {
                id: order.farmerStorageLink.id,
                accountNumber: order.farmerStorageLink.accountNumber,
                farmer: order.farmerStorageLink.farmer,
              }
            : undefined,
          createdBy: order.createdBy || undefined,
          varieties: order.varieties?.map((variety) => ({
            name: variety.name,
            bagSizes: variety.bagSizes?.map((bag) => ({
              name: bag.name,
              quantityInit: bag.quantityInit,
              quantityCurr: bag.quantityCurr,
              approxWeight: bag.approxWeight ?? undefined,
              customMarka: (bag as { customMarka?: string }).customMarka ?? undefined,
              locationId: bag.locationId,
              floor: (bag as { floor?: string }).floor,
              row: (bag as { row?: string }).row,
              chamber: (bag as { chamber?: string }).chamber,
            })),
          })),
        }));

        sortBagSizes(daybookOrders);

        return {
          data: daybookOrders,
        };
      }

      case 'outgoing': {
        const outgoingOrders = await this.fastify.prisma.outgoingOrder.findMany({
          where: where as Prisma.OutgoingOrderWhereInput,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            farmerStorageLinkId: true,
            coldStorageId: true,
            commodity: true,
            gatePassType: true,
            gatePassNumber: true,
            remarks: true,
            currentStockAtThatTime: true,
            varieties: true,
            totalBags: true,
            totalWeight: true,
            date: true,
            createdAt: true,
            updatedAt: true,
            farmerStorageLink: {
              select: {
                id: true,
                farmer: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    mobileNumber: true,
                    imageUrl: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Sort by date ?? createdAt
        const sortedOrders = outgoingOrders.sort((a, b) => {
          const dateA = (a.date ?? a.createdAt).getTime();
          const dateB = (b.date ?? b.createdAt).getTime();
          return dateB - dateA;
        });

        // Enrich with locations
        const enrichedOrders = await enrichOrdersWithLocations(sortedOrders);

        const daybookOrders: DaybookOrderItem[] = enrichedOrders.map((order) => ({
          id: order.id,
          type: 'outgoing' as const,
          farmerStorageLinkId: order.farmerStorageLinkId,
          coldStorageId: order.coldStorageId,
          commodity: order.commodity,
          gatePassType: order.gatePassType,
          date: order.date || order.createdAt,
          gatePassNumber: order.gatePassNumber,
          remarks: order.remarks,
          currentStockAtThatTime: order.currentStockAtThatTime,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          farmerStorageLink: order.farmerStorageLink
            ? {
                id: order.farmerStorageLink.id,
                farmer: order.farmerStorageLink.farmer,
              }
            : undefined,
          totalBags: order.totalBags,
          totalWeight: order.totalWeight,
          createdBy: order.createdBy || undefined,
          varieties: order.varieties?.map((variety) => ({
            name: variety.name,
            bagSizes: variety.bagSizes?.map((bag) => ({
              name: bag.name,
              quantityInit: bag.quantityBefore,
              quantityCurr: bag.quantityAfter,
              approxWeight: bag.approxWeight ?? undefined,
              locationId: bag.locationId,
              incomingOrderId: bag.incomingOrderId,
              floor: (bag as { floor?: string }).floor,
              row: (bag as { row?: string }).row,
              chamber: (bag as { chamber?: string }).chamber,
            })),
          })),
        }));

        // Enrich with incoming order gatePass numbers
        const enrichedDaybookOrders = await enrichDaybookOrdersWithIncomingGatePass(daybookOrders);

        // Sort bag sizes
        sortBagSizes(enrichedDaybookOrders);

        return {
          data: enrichedDaybookOrders,
        };
      }

      case 'all': {
        const [incomingOrders, outgoingOrders] = await Promise.all([
          this.fastify.prisma.incomingOrder.findMany({
            where: where as Prisma.IncomingOrderWhereInput,
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              farmerStorageLinkId: true,
              coldStorageId: true,
              commodity: true,
              gatePassType: true,
              gatePassNumber: true,
              remarks: true,
              currentStockAtThatTime: true,
              varieties: true,
              date: true,
              createdAt: true,
              updatedAt: true,
              farmerStorageLink: {
                select: farmerStorageLinkSelect,
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          this.fastify.prisma.outgoingOrder.findMany({
            where: where as Prisma.OutgoingOrderWhereInput,
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              farmerStorageLinkId: true,
              coldStorageId: true,
              commodity: true,
              gatePassType: true,
              gatePassNumber: true,
              remarks: true,
              currentStockAtThatTime: true,
              varieties: true,
              totalBags: true,
              totalWeight: true,
              date: true,
              createdAt: true,
              updatedAt: true,
              farmerStorageLink: {
                select: {
                  id: true,
                  farmer: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      mobileNumber: true,
                      imageUrl: true,
                    },
                  },
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
        ]);

        // Merge and sort (using efficient merge for pre-sorted arrays)
        const allOrders: DaybookOrderItem[] = [];
        let incomingIdx = 0;
        let outgoingIdx = 0;

        // Merge two sorted arrays efficiently
        while (incomingIdx < incomingOrders.length || outgoingIdx < outgoingOrders.length) {
          const incomingOrder = incomingOrders[incomingIdx];
          const outgoingOrder = outgoingOrders[outgoingIdx];

          if (!incomingOrder) {
            allOrders.push({
              id: outgoingOrder.id,
              type: 'outgoing',
              farmerStorageLinkId: outgoingOrder.farmerStorageLinkId,
              coldStorageId: outgoingOrder.coldStorageId,
              commodity: outgoingOrder.commodity,
              gatePassType: outgoingOrder.gatePassType,
              date: outgoingOrder.date || outgoingOrder.createdAt,
              gatePassNumber: outgoingOrder.gatePassNumber,
              remarks: outgoingOrder.remarks,
              currentStockAtThatTime: outgoingOrder.currentStockAtThatTime,
              createdAt: outgoingOrder.createdAt,
              updatedAt: outgoingOrder.updatedAt,
              farmerStorageLink: outgoingOrder.farmerStorageLink
                ? {
                    id: outgoingOrder.farmerStorageLink.id,
                    farmer: outgoingOrder.farmerStorageLink.farmer,
                  }
                : undefined,
              totalBags: outgoingOrder.totalBags,
              totalWeight: outgoingOrder.totalWeight,
              createdBy: outgoingOrder.createdBy || undefined,
              varieties: outgoingOrder.varieties?.map((variety) => ({
                name: variety.name,
                bagSizes: variety.bagSizes?.map((bag) => ({
                  name: bag.name,
                  quantityInit: bag.quantityBefore,
                  quantityCurr: bag.quantityAfter,
                  approxWeight: bag.approxWeight ?? undefined,
                  locationId: bag.locationId,
                  incomingOrderId: bag.incomingOrderId,
                })),
              })),
            });
            outgoingIdx++;
          } else if (!outgoingOrder) {
            allOrders.push({
              id: incomingOrder.id,
              type: 'incoming',
              farmerStorageLinkId: incomingOrder.farmerStorageLinkId,
              coldStorageId: incomingOrder.coldStorageId,
              commodity: incomingOrder.commodity,
              gatePassType: incomingOrder.gatePassType,
              date: incomingOrder.date || incomingOrder.createdAt,
              gatePassNumber: incomingOrder.gatePassNumber,
              remarks: incomingOrder.remarks,
              currentStockAtThatTime: incomingOrder.currentStockAtThatTime,
              createdAt: incomingOrder.createdAt,
              updatedAt: incomingOrder.updatedAt,
              farmerStorageLink: incomingOrder.farmerStorageLink
                ? {
                    id: incomingOrder.farmerStorageLink.id,
                    accountNumber: incomingOrder.farmerStorageLink.accountNumber,
                    farmer: incomingOrder.farmerStorageLink.farmer,
                  }
                : undefined,
              createdBy: incomingOrder.createdBy || undefined,
              varieties: incomingOrder.varieties?.map((variety) => ({
                name: variety.name,
                bagSizes: variety.bagSizes?.map((bag) => ({
                  name: bag.name,
                  quantityInit: bag.quantityInit,
                  quantityCurr: bag.quantityCurr,
                  approxWeight: bag.approxWeight ?? undefined,
                  customMarka: (bag as { customMarka?: string }).customMarka ?? undefined,
                  locationId: bag.locationId,
                })),
              })),
            });
            incomingIdx++;
          } else {
            // Use date ?? createdAt for comparison
            const incomingTime = (incomingOrder.date ?? incomingOrder.createdAt).getTime();
            const outgoingTime = (outgoingOrder.date ?? outgoingOrder.createdAt).getTime();

            if (outgoingTime >= incomingTime) {
              allOrders.push({
                id: incomingOrder.id,
                type: 'incoming',
                farmerStorageLinkId: incomingOrder.farmerStorageLinkId,
                coldStorageId: incomingOrder.coldStorageId,
                commodity: incomingOrder.commodity,
                gatePassType: incomingOrder.gatePassType,
                date: incomingOrder.date || incomingOrder.createdAt,
                gatePassNumber: incomingOrder.gatePassNumber,
                remarks: incomingOrder.remarks,
                currentStockAtThatTime: incomingOrder.currentStockAtThatTime,
                createdAt: incomingOrder.createdAt,
                updatedAt: incomingOrder.updatedAt,
                farmerStorageLink: incomingOrder.farmerStorageLink
                  ? {
                      id: incomingOrder.farmerStorageLink.id,
                      accountNumber: incomingOrder.farmerStorageLink.accountNumber,
                      farmer: incomingOrder.farmerStorageLink.farmer,
                    }
                  : undefined,
                createdBy: incomingOrder.createdBy || undefined,
                varieties: incomingOrder.varieties?.map((variety) => ({
                  name: variety.name,
                  bagSizes: variety.bagSizes?.map((bag) => ({
                    name: bag.name,
                    quantityInit: bag.quantityInit,
                    quantityCurr: bag.quantityCurr,
                    approxWeight: bag.approxWeight ?? undefined,
                    customMarka: (bag as { customMarka?: string }).customMarka ?? undefined,
                    locationId: bag.locationId,
                  })),
                })),
              });
              incomingIdx++;
            } else {
              allOrders.push({
                id: outgoingOrder.id,
                type: 'outgoing',
                farmerStorageLinkId: outgoingOrder.farmerStorageLinkId,
                coldStorageId: outgoingOrder.coldStorageId,
                commodity: outgoingOrder.commodity,
                gatePassType: outgoingOrder.gatePassType,
                date: outgoingOrder.date || outgoingOrder.createdAt,
                gatePassNumber: outgoingOrder.gatePassNumber,
                remarks: outgoingOrder.remarks,
                currentStockAtThatTime: outgoingOrder.currentStockAtThatTime,
                createdAt: outgoingOrder.createdAt,
                updatedAt: outgoingOrder.updatedAt,
                farmerStorageLink: outgoingOrder.farmerStorageLink
                  ? {
                      id: outgoingOrder.farmerStorageLink.id,
                      farmer: outgoingOrder.farmerStorageLink.farmer,
                    }
                  : undefined,
                totalBags: outgoingOrder.totalBags,
                totalWeight: outgoingOrder.totalWeight,
                createdBy: outgoingOrder.createdBy || undefined,
                varieties: outgoingOrder.varieties?.map((variety) => ({
                  name: variety.name,
                  bagSizes: variety.bagSizes?.map((bag) => ({
                    name: bag.name,
                    quantityInit: bag.quantityBefore,
                    quantityCurr: bag.quantityAfter,
                    approxWeight: bag.approxWeight ?? undefined,
                    locationId: bag.locationId,
                    incomingOrderId: bag.incomingOrderId,
                  })),
                })),
              });
              outgoingIdx++;
            }
          }
        }

        // Enrich with locations (batch fetch)
        const enrichedOrders = await enrichOrdersWithLocations(allOrders);

        // Enrich with incoming order gatePass numbers
        const enrichedDaybookOrders = await enrichDaybookOrdersWithIncomingGatePass(enrichedOrders);

        // Sort bag sizes
        sortBagSizes(enrichedDaybookOrders);

        return {
          data: enrichedDaybookOrders,
        };
      }

      default:
        throw new StoreAdminValidationError(
          "Invalid type parameter. Use 'all', 'incoming', or 'outgoing'."
        );
    }
  }

  /**
   * Get cold storage analytics overview
   * Aggregates data from IncomingOrder and OutgoingOrder to provide comprehensive analytics
   */
  async getColdStorageAnalytics(options: {
    coldStorageId: string;
    dateFrom?: string;
    dateTo?: string;
    commodity?: Commodity;
    farmerId?: string;
    locationId?: string;
  }): Promise<{
    meta: {
      coldStorageId: string;
      generatedAt: string;
      unit: string;
    };
    summary: {
      totalBagsInitial: number;
      totalBagsCurrent: number;
      totalIncomingBags: number;
      totalOutgoingBags: number;
    };
    commoditySummary: Array<{
      commodity: string;
      totalCurrent: number;
      varieties: Array<{
        varietyName: string;
        totalCurrent: number;
        bagSizes: Array<{
          size: string;
          totalInitial: number;
          totalCurrent: number;
          totalOutgoing: number;
        }>;
      }>;
    }>;
    stockTrend: Array<{
      date: string;
      incoming: number;
      outgoing: number;
      netChange: number;
      totalStock: number;
    }>;
    locationAnalytics: Array<{
      locationId: string;
      floor: string;
      row: string;
      chamber: string;
      totalCurrentBags: number;
      breakdownByFarmer: Array<{
        farmerId: string;
        farmerName: string;
        accountNumber: number;
        totalCurrentBags: number;
        details: Array<{
          commodity: string;
          variety: string;
          size: string;
          storedOn: string;
          initialQuantity: number;
          currentQuantity: number;
        }>;
      }>;
    }>;
  }> {
    const { coldStorageId, dateFrom, dateTo, commodity, farmerId, locationId } = options;

    // Build date filter - match orders where date (if set) or createdAt (if date is null) falls within range
    const buildDateFilter = () => {
      if (!dateFrom && !dateTo) return undefined;

      const dateFilter: Prisma.DateTimeFilter = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };

      return [
        // Orders with date field set - check date field
        { date: { ...dateFilter, not: null } },
        // Orders with date field null - check createdAt
        { date: null, createdAt: dateFilter },
      ] as const;
    };

    const dateOrFilter = buildDateFilter();

    // Build where clause for incoming orders
    const incomingWhere: Prisma.IncomingOrderWhereInput = {
      coldStorageId,
      ...(commodity && { commodity }),
      ...(farmerId && { farmerStorageLinkId: farmerId }),
      ...(dateOrFilter && { OR: [...dateOrFilter] as Prisma.IncomingOrderWhereInput['OR'] }),
    };

    // Build where clause for outgoing orders
    const outgoingWhere: Prisma.OutgoingOrderWhereInput = {
      coldStorageId,
      ...(commodity && { commodity }),
      ...(farmerId && { farmerStorageLinkId: farmerId }),
      ...(dateOrFilter && { OR: [...dateOrFilter] as Prisma.OutgoingOrderWhereInput['OR'] }),
    };

    // Fetch all incoming orders with required fields
    const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
      where: incomingWhere,
      select: {
        id: true,
        date: true,
        createdAt: true,
        commodity: true,
        farmerStorageLinkId: true,
        varieties: true,
        farmerStorageLink: {
          select: {
            id: true,
            farmer: {
              select: {
                id: true,
                name: true,
              },
            },
            accountNumber: true,
          },
        },
      },
    });

    // Fetch all outgoing orders with required fields
    const outgoingOrders = await this.fastify.prisma.outgoingOrder.findMany({
      where: outgoingWhere,
      select: {
        id: true,
        date: true,
        createdAt: true,
        commodity: true,
        farmerStorageLinkId: true,
        varieties: true,
        farmerStorageLink: {
          select: {
            id: true,
            farmer: {
              select: {
                id: true,
                name: true,
              },
            },
            accountNumber: true,
          },
        },
      },
    });

    // Fetch all locations for this cold storage
    const locations = await this.fastify.prisma.location.findMany({
      where: {
        coldStorageId,
        ...(locationId && { id: locationId }),
      },
    });

    const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

    // Helper: Get effective date (date ?? createdAt)
    const getEffectiveDate = (order: { date: Date | null; createdAt: Date }): Date => {
      return order.date ?? order.createdAt;
    };

    // 1. Calculate Summary (all commodities combined)
    let totalBagsInitial = 0;
    let totalBagsCurrent = 0;
    let totalIncomingBags = 0;
    let totalOutgoingBags = 0;

    // Process incoming orders for summary
    for (const order of incomingOrders) {
      for (const variety of order.varieties || []) {
        for (const bagSize of variety.bagSizes || []) {
          if (locationId && bagSize.locationId !== locationId) continue;
          totalBagsInitial += bagSize.quantityInit;
          totalBagsCurrent += bagSize.quantityCurr;
          totalIncomingBags += bagSize.quantityInit;
        }
      }
    }

    // Process outgoing orders for summary
    for (const order of outgoingOrders) {
      for (const variety of order.varieties || []) {
        for (const bagSize of variety.bagSizes || []) {
          if (locationId && bagSize.locationId !== locationId) continue;
          totalOutgoingBags += bagSize.quantityRemoved;
        }
      }
    }

    // 2. Calculate Commodity Summary
    const commodityMap = new Map<
      string,
      {
        commodity: string;
        varieties: Map<
          string,
          {
            varietyName: string;
            bagSizes: Map<
              string,
              {
                totalInitial: number;
                totalCurrent: number;
              }
            >;
          }
        >;
      }
    >();

    // Process incoming orders for commodity summary
    for (const order of incomingOrders) {
      if (!commodityMap.has(order.commodity)) {
        commodityMap.set(order.commodity, {
          commodity: order.commodity,
          varieties: new Map(),
        });
      }
      const commodityData = commodityMap.get(order.commodity);
      if (!commodityData) continue;

      for (const variety of order.varieties || []) {
        if (!commodityData.varieties.has(variety.name)) {
          commodityData.varieties.set(variety.name, {
            varietyName: variety.name,
            bagSizes: new Map(),
          });
        }
        const varietyData = commodityData.varieties.get(variety.name);
        if (!varietyData) continue;

        for (const bagSize of variety.bagSizes || []) {
          if (locationId && bagSize.locationId !== locationId) continue;
          const existing = varietyData.bagSizes.get(bagSize.name) || {
            totalInitial: 0,
            totalCurrent: 0,
          };
          varietyData.bagSizes.set(bagSize.name, {
            totalInitial: existing.totalInitial + bagSize.quantityInit,
            totalCurrent: existing.totalCurrent + bagSize.quantityCurr,
          });
        }
      }
    }

    // Note: quantityCurr in IncomingOrder already reflects current stock after outgoing orders
    // So we don't need to process outgoing orders for commodity summary

    // Convert commodity map to array format
    const commoditySummary = Array.from(commodityMap.values()).map((commodityData) => {
      let totalCurrent = 0;
      const varieties = Array.from(commodityData.varieties.values()).map((varietyData) => {
        const bagSizes = Array.from(varietyData.bagSizes.entries()).map(
          ([size, { totalInitial, totalCurrent: bagSizeTotalCurrent }]) => ({
            size,
            totalInitial,
            totalCurrent: bagSizeTotalCurrent,
            totalOutgoing: totalInitial - bagSizeTotalCurrent,
          })
        );
        const varietyTotal = bagSizes.reduce((sum, bs) => sum + bs.totalCurrent, 0);
        totalCurrent += varietyTotal;
        return {
          varietyName: varietyData.varietyName,
          totalCurrent: varietyTotal,
          bagSizes,
        };
      });
      return {
        commodity: commodityData.commodity,
        totalCurrent,
        varieties,
      };
    });

    // 3. Calculate Stock Trend (time-series data)
    interface TrendPoint {
      date: Date;
      incoming: number;
      outgoing: number;
    }

    const trendMap = new Map<string, TrendPoint>();

    // Process incoming orders for trend
    for (const order of incomingOrders) {
      const effectiveDate = getEffectiveDate(order);
      const dateKey = effectiveDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: new Date(effectiveDate.setHours(0, 0, 0, 0)),
          incoming: 0,
          outgoing: 0,
        });
      }

      const point = trendMap.get(dateKey);
      if (!point) continue;
      for (const variety of order.varieties || []) {
        for (const bagSize of variety.bagSizes || []) {
          if (locationId && bagSize.locationId !== locationId) continue;
          point.incoming += bagSize.quantityInit;
        }
      }
    }

    // Process outgoing orders for trend
    for (const order of outgoingOrders) {
      const effectiveDate = getEffectiveDate(order);
      const dateKey = effectiveDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: new Date(effectiveDate.setHours(0, 0, 0, 0)),
          incoming: 0,
          outgoing: 0,
        });
      }

      const point = trendMap.get(dateKey);
      if (!point) continue;
      for (const variety of order.varieties || []) {
        for (const bagSize of variety.bagSizes || []) {
          if (locationId && bagSize.locationId !== locationId) continue;
          point.outgoing += bagSize.quantityRemoved;
        }
      }
    }

    // Convert trend map to sorted array with running total
    const sortedTrendPoints = Array.from(trendMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    let runningTotal = 0;
    const stockTrend = sortedTrendPoints.map((point) => {
      const netChange = point.incoming - point.outgoing;
      runningTotal += netChange;
      return {
        date: point.date.toISOString(),
        incoming: point.incoming,
        outgoing: point.outgoing,
        netChange,
        totalStock: runningTotal,
      };
    });

    // 4. Calculate Location Analytics
    const locationAnalyticsMap = new Map<
      string,
      {
        locationId: string;
        floor: string;
        row: string;
        chamber: string;
        farmers: Map<
          string,
          {
            farmerId: string;
            farmerName: string;
            accountNumber: number;
            details: Array<{
              commodity: string;
              variety: string;
              size: string;
              storedOn: string;
              initialQuantity: number;
              currentQuantity: number;
            }>;
          }
        >;
      }
    >();

    // Process incoming orders for location analytics
    for (const order of incomingOrders) {
      const effectiveDate = getEffectiveDate(order);
      const farmerLink = order.farmerStorageLink;

      for (const variety of order.varieties || []) {
        for (const bagSize of variety.bagSizes || []) {
          if (locationId && bagSize.locationId !== locationId) continue;

          const location = locationMap.get(bagSize.locationId);
          if (!location) continue;

          if (!locationAnalyticsMap.has(bagSize.locationId)) {
            locationAnalyticsMap.set(bagSize.locationId, {
              locationId: bagSize.locationId,
              floor: location.floor,
              row: location.row,
              chamber: location.chamber,
              farmers: new Map(),
            });
          }

          const locationData = locationAnalyticsMap.get(bagSize.locationId);
          if (!locationData) continue;
          const farmerKey = order.farmerStorageLinkId;

          if (!locationData.farmers.has(farmerKey)) {
            locationData.farmers.set(farmerKey, {
              farmerId: farmerLink?.id || order.farmerStorageLinkId,
              farmerName: farmerLink?.farmer?.name || 'Unknown',
              accountNumber: farmerLink?.accountNumber || 0,
              details: [],
            });
          }

          const farmerData = locationData.farmers.get(farmerKey);
          if (!farmerData) continue;
          farmerData.details.push({
            commodity: order.commodity,
            variety: variety.name,
            size: bagSize.name,
            storedOn: effectiveDate.toISOString(),
            initialQuantity: bagSize.quantityInit,
            currentQuantity: bagSize.quantityCurr,
          });
        }
      }
    }

    // Note: quantityCurr in IncomingOrder already reflects current stock after outgoing orders
    // So we don't need to process outgoing orders to update currentQuantity in location analytics

    // Convert location analytics map to array format
    const locationAnalytics = Array.from(locationAnalyticsMap.values()).map((locationData) => {
      const breakdownByFarmer = Array.from(locationData.farmers.values()).map((farmerData) => {
        const totalCurrentBags = farmerData.details.reduce(
          (sum, detail) => sum + detail.currentQuantity,
          0
        );
        return {
          farmerId: farmerData.farmerId,
          farmerName: farmerData.farmerName,
          accountNumber: farmerData.accountNumber,
          totalCurrentBags,
          details: farmerData.details,
        };
      });

      const totalCurrentBags = breakdownByFarmer.reduce(
        (sum, farmer) => sum + farmer.totalCurrentBags,
        0
      );

      return {
        locationId: locationData.locationId,
        floor: locationData.floor,
        row: locationData.row,
        chamber: locationData.chamber,
        totalCurrentBags,
        breakdownByFarmer,
      };
    });

    return {
      meta: {
        coldStorageId,
        generatedAt: new Date().toISOString(),
        unit: 'bags',
      },
      summary: {
        totalBagsInitial,
        totalBagsCurrent,
        totalIncomingBags,
        totalOutgoingBags,
      },
      commoditySummary,
      stockTrend,
      locationAnalytics,
    };
  }

  /**
   * Get variety-wise inventory analysis for a given storage
   * Returns farmers with their available quantities grouped by bag size,
   * and location-wise aggregation of quantities
   */
  async getVarietyInventoryAnalysis(
    storageId: string,
    commodity: Commodity,
    variety: string
  ): Promise<VarietyInventoryAnalysisResponse> {
    // Step 1: Fetch all farmers linked to the storage
    const farmerLinks = await this.fastify.prisma.farmerStorageLink.findMany({
      where: {
        coldStorageId: storageId,
        isActive: true,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (farmerLinks.length === 0) {
      return {
        commodity,
        variety,
        farmers: [],
        locations: [],
      };
    }

    const farmerLinkIds = farmerLinks.map((link) => link.id);

    // Step 2: Fetch all incoming orders for these farmers with the given commodity
    // Note: We filter by variety in JavaScript since Prisma doesn't support MongoDB array queries directly
    const incomingOrders = await this.fastify.prisma.incomingOrder.findMany({
      where: {
        farmerStorageLinkId: { in: farmerLinkIds },
        coldStorageId: storageId,
        commodity,
      },
      select: {
        id: true,
        farmerStorageLinkId: true,
        varieties: true,
      },
    });

    // Step 3: Filter and process orders to extract relevant data
    // Create a map to aggregate by farmer
    const farmerMap = new Map<
      string,
      {
        farmerId: string;
        farmerName: string;
        sizes: Map<
          string,
          {
            totalInitial: number;
            totalCurrent: number;
          }
        >; // size -> { totalInitial, totalCurrent }
      }
    >();

    // Create a map to aggregate by location
    const locationMap = new Map<
      string,
      {
        locationId: string;
        sizes: Map<
          string,
          {
            totalInitial: number;
            totalCurrent: number;
          }
        >; // size -> { totalInitial, totalCurrent }
      }
    >();

    // Collect all location IDs for batch fetch
    const locationIds = new Set<string>();

    // Process each incoming order - filter by variety in JavaScript
    for (const order of incomingOrders) {
      const farmerLink = farmerLinks.find((link) => link.id === order.farmerStorageLinkId);
      if (!farmerLink) continue;

      // Filter varieties to only include the specified variety
      const orderVarieties = (
        order.varieties as Array<{
          name: string;
          bagSizes: Array<{
            name: string;
            quantityInit: number;
            quantityCurr: number;
            locationId: string;
          }>;
        }>
      ).filter((v) => v.name === variety);

      // Skip if no matching variety found
      if (orderVarieties.length === 0) continue;

      const farmerKey = order.farmerStorageLinkId;

      // Initialize farmer in map if not exists
      if (!farmerMap.has(farmerKey)) {
        farmerMap.set(farmerKey, {
          farmerId: farmerLink.farmerId,
          farmerName: farmerLink.farmer.name,
          sizes: new Map(),
        });
      }

      const farmerData = farmerMap.get(farmerKey);
      if (!farmerData) continue;

      // Process matching varieties
      for (const orderVariety of orderVarieties) {
        for (const bagSize of orderVariety.bagSizes || []) {
          // Add to farmer aggregation
          const existingFarmerData = farmerData.sizes.get(bagSize.name) || {
            totalInitial: 0,
            totalCurrent: 0,
          };
          farmerData.sizes.set(bagSize.name, {
            totalInitial: existingFarmerData.totalInitial + bagSize.quantityInit,
            totalCurrent: existingFarmerData.totalCurrent + bagSize.quantityCurr,
          });

          // Add to location aggregation
          locationIds.add(bagSize.locationId);
          if (!locationMap.has(bagSize.locationId)) {
            locationMap.set(bagSize.locationId, {
              locationId: bagSize.locationId,
              sizes: new Map(),
            });
          }

          const locationData = locationMap.get(bagSize.locationId);
          if (!locationData) continue;
          const existingLocationData = locationData.sizes.get(bagSize.name) || {
            totalInitial: 0,
            totalCurrent: 0,
          };
          locationData.sizes.set(bagSize.name, {
            totalInitial: existingLocationData.totalInitial + bagSize.quantityInit,
            totalCurrent: existingLocationData.totalCurrent + bagSize.quantityCurr,
          });
        }
      }
    }

    // Step 4: Fetch location details
    const locations = await this.fastify.prisma.location.findMany({
      where: {
        id: { in: Array.from(locationIds) },
        coldStorageId: storageId,
      },
      select: {
        id: true,
        floor: true,
        row: true,
        chamber: true,
      },
    });

    const locationDetailsMap = new Map(locations.map((loc) => [loc.id, loc]));

    // Step 5: Build response - farmers
    const farmers = Array.from(farmerMap.values())
      .map((farmerData) => {
        const sizes = Array.from(farmerData.sizes.entries())
          .map(([size, { totalInitial, totalCurrent }]) => ({
            size,
            totalInitial,
            totalCurrent,
            totalOutgoing: totalInitial - totalCurrent,
          }))
          .sort((a, b) => a.size.localeCompare(b.size));

        const totalInitial = sizes.reduce((sum, s) => sum + s.totalInitial, 0);
        const totalCurrent = sizes.reduce((sum, s) => sum + s.totalCurrent, 0);
        const totalOutgoing = totalInitial - totalCurrent;

        return {
          farmerId: farmerData.farmerId,
          farmerName: farmerData.farmerName,
          sizes,
          totalInitial,
          totalCurrent,
          totalOutgoing,
        };
      })
      .filter((farmer) => farmer.totalCurrent > 0) // Only include farmers with current stock
      .sort((a, b) => a.farmerName.localeCompare(b.farmerName));

    // Step 6: Build response - locations
    const locationsResponse = Array.from(locationMap.entries())
      .map(([locationId, locationData]) => {
        const locationDetails = locationDetailsMap.get(locationId);
        if (!locationDetails) return null;

        const sizes = Array.from(locationData.sizes.entries())
          .map(([size, { totalInitial, totalCurrent }]) => ({
            size,
            totalInitial,
            totalCurrent,
            totalOutgoing: totalInitial - totalCurrent,
          }))
          .sort((a, b) => a.size.localeCompare(b.size));

        const totalInitial = sizes.reduce((sum, s) => sum + s.totalInitial, 0);
        const totalCurrent = sizes.reduce((sum, s) => sum + s.totalCurrent, 0);
        const totalOutgoing = totalInitial - totalCurrent;

        return {
          location: {
            chamber: locationDetails.chamber,
            floor: locationDetails.floor,
            row: locationDetails.row,
          },
          totalInitial,
          totalCurrent,
          totalOutgoing,
          sizes,
        };
      })
      .filter((loc): loc is NonNullable<typeof loc> => loc !== null && loc.totalCurrent > 0)
      .sort((a, b) => {
        // Sort by chamber, then floor, then row
        const chamberCompare = a.location.chamber.localeCompare(b.location.chamber);
        if (chamberCompare !== 0) return chamberCompare;
        const floorCompare = a.location.floor.localeCompare(b.location.floor);
        if (floorCompare !== 0) return floorCompare;
        return a.location.row.localeCompare(b.location.row);
      });

    return {
      commodity,
      variety,
      farmers,
      locations: locationsResponse,
    };
  }
}
