import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError, SenhaTemporariaError } from '../hooks/errors.ts';
import type { Roles } from '../types/enum/roles.ts';

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
  if (request.user.mustChangePassword === true) {
    throw new SenhaTemporariaError();
  }
}

export function authorize(...roles: Array<Roles>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    const role = request.user.role;
    if (!role || !roles.includes(role)) {
      throw new ForbiddenError();
    }
  };
}
