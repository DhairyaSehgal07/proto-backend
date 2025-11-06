// ESM
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import prismaPlugin from './plugins/prisma.js';

config();

/**
 * Run the server!
 */
const start = async () => {
  try {
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

    // Health check endpoint
    fastify.get('/health', () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ColdOp-backend',
      };
    });

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

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

void start();
