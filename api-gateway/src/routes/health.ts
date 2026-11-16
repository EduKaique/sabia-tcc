import type { FastifyInstance } from 'fastify';

// Público (o Caddy expõe como /api/health): só o status, sem detalhes internos.
export function registerHealthCheck(gateway: FastifyInstance) {
  gateway.get('/health', async () => ({ status: 'ok' }));
}
