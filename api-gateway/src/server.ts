import Fastify from 'fastify';
import { registerCors } from './plugins/cors.ts';
import { registerProxies } from './routes/proxy.ts';
import { registerHealthCheck } from './routes/health.ts';
import { registerErrorHandler } from './hooks/error-handler.ts';
import jwtPlugin from './plugins/jwt.ts';
import { env } from './config/env.ts';

const gateway = Fastify({
  logger: true,
  // Atrás do proxy (Caddy): request.ip vem do X-Forwarded-For. O gateway não é exposto.
  trustProxy: true,
});

await registerCors(gateway);
await gateway.register(jwtPlugin);

await registerProxies(gateway);
registerHealthCheck(gateway);
registerErrorHandler(gateway);

try {
  await gateway.listen({ port: env.PORT, host: '0.0.0.0' });
  gateway.log.info(`API Gateway rodando em http://localhost:${env.PORT}`);
} catch (err) {
  gateway.log.error(err);
  process.exit(1);
}
