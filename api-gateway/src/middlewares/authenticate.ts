import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../hooks/errors.ts';
import type { Roles } from '../types/enum/roles.ts';

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
}

export function authorize(...roles: Array<Roles>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    const role = request.user.role ?? (request.user.perfil === 'ADMINISTRADOR' ? 'ADMIN' : request.user.perfil);
    if (!role || !roles.includes(role)) {
      throw new ForbiddenError();
    }
  };
}
