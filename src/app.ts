// app.ts
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma.js';
import { config } from 'dotenv';
import coldStorageRoutes from '@/modules/base/cold-storage/v1/routes/cold-storage.routes.js';
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

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  // Register Prisma plugin
  await fastify.register(prismaPlugin);
  await fastify.register(coldStorageRoutes, { prefix: '/api/v1/base/cold-storage' });

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
