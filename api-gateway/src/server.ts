import Fastify from 'fastify';
import { registerCors } from './plugins/cors.ts';
import { registerProxies } from './routes/proxy.ts';
import { registerHealthCheck } from './routes/health.ts';
import { registerErrorHandler } from './hooks/error-handler.ts';
import { registrarLimiteTentativas } from './hooks/limite-tentativas.ts';
import jwtPlugin from './plugins/jwt.ts';
import { env } from './config/env.ts';

const gateway = Fastify({
  logger: true,
  // Atrás do proxy (Caddy): confia só no último salto do X-Forwarded-For (o Caddy), então um
  // valor forjado pelo cliente à esquerda não muda request.ip. O gateway não é exposto.
  trustProxy: 1,
});

await registerCors(gateway);
await gateway.register(jwtPlugin);

// Antes dos proxies: o hook onRequest precisa valer para as rotas que eles registram.
registrarLimiteTentativas(gateway, env.limiteTentativas);
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
