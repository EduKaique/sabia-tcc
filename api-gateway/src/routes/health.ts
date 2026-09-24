import type { FastifyInstance } from 'fastify';

export function registerHealthCheck(gateway: FastifyInstance) {
  gateway.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    upstreams: {
      auth: process.env.AUTH_URL || 'http://localhost:8080',
      pedagogico: process.env.PEDAGOGICO_URL || 'http://localhost:8081',
    },
  }));
}
