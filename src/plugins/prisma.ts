import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { PrismaClient } from '../../generated/prisma/client.js';

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server: FastifyInstance, _options) => {
  // Prisma 6.19.0 has native MongoDB support - no adapter needed
  const prisma: PrismaClient = new PrismaClient();

  await prisma.$connect();

  // Make Prisma Client available through the fastify server instance: server.prisma
  server.decorate('prisma', prisma);

  server.addHook('onClose', async (instance: FastifyInstance) => {
    await instance.prisma.$disconnect();
  });
});

export default prismaPlugin;
