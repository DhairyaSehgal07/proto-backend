import type { FastifyRequest, FastifyReply } from 'fastify';
import { StoreAdminDAO } from '@/modules/base/store-admin/v1/dao/store-admin.dao.js';
import type { Prisma as PrismaTypes } from '../../../generated/prisma/client.js';

/**
 * Extended FastifyRequest with admin property
 */
declare module 'fastify' {
  interface FastifyRequest {
    admin?: PrismaTypes.StoreAdminGetPayload<{
      include: { coldStorage: true };
    }>;
  }
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  adminId: string;
  adminName: string;
  coldStorageId: string;
  coldStorageImageUrl: string | null;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate store admin via JWT token
 * Supports both Bearer token (Authorization header) and cookie-based authentication
 */
export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    let token: string | undefined;

    // Check for token in Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      // Check for token in cookie (cookie name is 'jwt')
      token = request.cookies.jwt;
    }

    if (!token) {
      reply.code(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
      return;
    }

    try {
      // Verify token using Fastify JWT
      // Use the JWT plugin's verify method which works with both header and manually provided tokens
      let decoded: JWTPayload;

      // If token is from Authorization header, use jwtVerify (async)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        decoded = await request.jwtVerify<JWTPayload>();
      } else {
        // If token is from cookie, verify manually using the JWT plugin
        decoded = request.server.jwt.verify<JWTPayload>(token);
      }

      // Get admin from database
      const dao = new StoreAdminDAO(request.server);
      const admin = await dao.findById(decoded.adminId);

      if (!admin) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Admin not found. Token is invalid.',
          },
        });
        return;
      }

      if (!admin.isVerified) {
        reply.code(403).send({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_VERIFIED',
            message: 'Admin account is not verified. Please contact administrator.',
          },
        });
        return;
      }

      // Attach admin to request
      request.admin = admin;
    } catch (error) {
      if (error && typeof error === 'object') {
        const jwtError = error as { code?: string; message?: string; statusCode?: number };
        if (
          jwtError.statusCode === 401 ||
          jwtError.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID'
        ) {
          reply.code(401).send({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid token. Please login again.',
            },
          });
          return;
        }
        if (jwtError.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
          reply.code(401).send({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired. Please login again.',
            },
          });
          return;
        }
      }

      request.server.log.error(error, 'JWT verification error');
      reply.code(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication error',
        },
      });
    }
  } catch (error) {
    request.server.log.error(error, 'Authentication middleware error');
    reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authentication error',
      },
    });
  }
}

/**
 * Middleware to check if admin has Admin role
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    if (!request.admin) {
      reply.code(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (request.admin.role !== 'Admin') {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Admin role required.',
        },
      });
      // eslint-disable-next-line no-useless-return
      return;
    }
  } catch (error) {
    request.server.log.error(error, 'Admin role check error');
    reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authorization error',
      },
    });
  }
}

/**
 * Middleware to check if admin belongs to the same cold storage
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function requireSameColdStorage(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    if (!request.admin) {
      reply.code(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    const requestedColdStorageId =
      (request.params as { coldStorageId?: string })?.coldStorageId ||
      (request.body as { coldStorage?: string; coldStorageId?: string })?.coldStorage ||
      (request.body as { coldStorage?: string; coldStorageId?: string })?.coldStorageId ||
      (request.query as { coldStorageId?: string })?.coldStorageId;

    const adminColdStorageId = request.admin.coldStorageId;

    if (requestedColdStorageId && requestedColdStorageId !== adminColdStorageId) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You can only access your own cold storage data.',
        },
      });
      // eslint-disable-next-line no-useless-return
      return;
    }
  } catch (error) {
    request.server.log.error(error, 'Cold storage check error');
    reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authorization error',
      },
    });
  }
}
