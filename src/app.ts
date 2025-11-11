// app.ts
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import prismaPlugin from './plugins/prisma.js';
import { config } from 'dotenv';
import coldStorageRoutes from '@/modules/base/cold-storage/v1/routes/cold-storage.routes.js';
import storeAdminRoutes from './modules/base/store-admin/v1/routes/store-admin.routes.js';
import rbacRoutes from './modules/base/rbac/v1/routes/rbac.routes.js';
import incomingOrderRoutes from './modules/base/incoming-orders/v1/routes/incoming-orders.routes.js';
import outgoingOrderRoutes from './modules/base/outgoing-orders/v1/index.js';
config();

export const buildApp = async (): Promise<FastifyInstance> => {
  const fastify: FastifyInstance = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register security headers (helmet)
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow CORS for API
  });

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // must NOT be '*'
    credentials: true, // ✅ allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register Prisma plugin
  await fastify.register(prismaPlugin);

  // Register Cookie plugin
  await fastify.register(cookie);

  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
  });

  // Register routes
  await fastify.register(coldStorageRoutes, { prefix: '/api/v1/base/cold-storage' });
  await fastify.register(storeAdminRoutes, { prefix: '/api/v1/base/store-admin' });
  await fastify.register(rbacRoutes, { prefix: '/api/v1/base/rbac' });
  await fastify.register(incomingOrderRoutes, { prefix: '/api/v1/base/incoming-orders' });
  await fastify.register(outgoingOrderRoutes, { prefix: '/api/v1/base/outgoing-orders' });

  // Health check endpoint
  fastify.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ColdOp-backend',
  }));

  // Global error handler
  fastify.setErrorHandler((error: Error, request, reply) => {
    fastify.log.error(error, 'Unhandled error');
    void reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
    });
  });

  return fastify;
};
