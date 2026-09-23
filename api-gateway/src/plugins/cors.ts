import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

export async function registerCors(gateway: FastifyInstance) {
  await gateway.register(cors, {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:8000')
      .split(',')
      .map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
}
