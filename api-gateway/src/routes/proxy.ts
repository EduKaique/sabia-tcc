import type { FastifyInstance } from 'fastify';
import proxy from '@fastify/http-proxy';
import { injectRequestId } from '../hooks/request-headers.ts';
import { authenticate, authorize } from '../middlewares/authenticate.ts';
import type { Roles } from '../types/enum/roles.ts';

type ProxyRoute = {
  upstream: string;
  prefix: string;
  rewritePrefix: string;
  protected?: boolean;
  roles?: Roles[];
};

const proxyRoutes: ProxyRoute[] = [
  {
    upstream: process.env.AUTH_URL || 'http://localhost:8080',
    prefix: '/api/auth',
    rewritePrefix: '/api/auth',
  },
  {
    upstream: process.env.PEDAGOGICO_URL || 'http://localhost:8081',
    prefix: '/api/pedagogico',
    rewritePrefix: '',
    protected: true,
  },
  {
    upstream: process.env.IA_URL || 'http://localhost:8002',
    prefix: '/api/ia',
    rewritePrefix: '',
    protected: true,
    roles: ['PROFESSOR'],
  },
];

export async function registerProxies(gateway: FastifyInstance) {
  for (const route of proxyRoutes) {
    await gateway.register(proxy, {
      upstream: route.upstream,
      prefix: route.prefix,
      rewritePrefix: route.rewritePrefix,
      preHandler: route.roles
        ? authorize(...route.roles)
        : route.protected
          ? authenticate
          : undefined,
      replyOptions: {
        rewriteRequestHeaders: injectRequestId,
      },
    });
  }
}
