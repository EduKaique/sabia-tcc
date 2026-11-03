import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../hooks/errors.ts';
import type { Roles } from '../types/enum/roles.ts';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
  // Troca de senha pendente: só a troca (no auth-service) fica liberada. Responde direto, no
  // mesmo formato dos serviços ({ status, erro, codigo }), para o front reconhecer pelo `codigo`.
  if (request.user.mustChangePassword === true) {
    return reply.code(403).send({
      status: 403,
      erro: 'Você precisa trocar sua senha para continuar.',
      codigo: 'SENHA_TEMPORARIA',
      timestamp: new Date().toISOString(),
    });
  }
}

export function authorize(...roles: Array<Roles>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return reply;
    const role = request.user.role;
    if (!role || !roles.includes(role)) {
      throw new ForbiddenError();
    }
  };
}
