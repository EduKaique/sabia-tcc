import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import proxy from '@fastify/http-proxy';
import { injectRequestId } from '../hooks/request-headers.ts';
import { authenticate, authorize } from '../middlewares/authenticate.ts';
import { blockPaths } from '../middlewares/block-paths.ts';
import type { Roles } from '../types/enum/roles.ts';

type ProxyRoute = {
  upstream: string;
  prefix: string;
  rewritePrefix: string;
  protected?: boolean;
  roles?: Roles[];
  blockedPaths?: string[];
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
    rewritePrefix: '/',
    protected: true,
    // Endpoints serviço-a-serviço (token SISTEMA) nunca são expostos: defesa em profundidade.
    blockedPaths: ['/api/interno'],
  },
  {
    // Rotas públicas do pedagógico (ex.: validação do código de convite): sem autenticação
    // e sem remover o prefixo, pois o serviço expõe /api/publico/**.
    upstream: process.env.PEDAGOGICO_URL || 'http://localhost:8081',
    prefix: '/api/publico',
    rewritePrefix: '/api/publico',
  },
  {
    upstream: process.env.IA_URL || 'http://localhost:8002',
    prefix: '/api/ia',
    rewritePrefix: '/',
    protected: true,
    roles: ['PROFESSOR'],
  },
];

export async function registerProxies(gateway: FastifyInstance) {
  for (const route of proxyRoutes) {
    const auth = route.roles
      ? authorize(...route.roles)
      : route.protected
        ? authenticate
        : undefined;
    // O bloqueio vem antes da autenticação: 404 com ou sem token.
    const handlers = [
      ...(route.blockedPaths ? [blockPaths(...route.blockedPaths)] : []),
      ...(auth ? [auth] : []),
    ];
    // @fastify/http-proxy aceita um único preHandler: executa em sequência.
    const preHandler = handlers.length
      ? async (request: FastifyRequest, reply: FastifyReply) => {
          for (const handler of handlers) await handler(request, reply);
        }
      : undefined;

    await gateway.register(proxy, {
      upstream: route.upstream,
      prefix: route.prefix,
      rewritePrefix: route.rewritePrefix,
      preHandler,
      replyOptions: {
        rewriteRequestHeaders: injectRequestId,
      },
    });
  }
}
