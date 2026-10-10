import '@fastify/jwt';
import { Roles } from './enum/roles.ts';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      role?: Roles;
      perfil?: Roles | 'ADMINISTRADOR';
      email: string;
    };
    user: {
      sub: string;
      role?: Roles;
      perfil?: Roles | 'ADMINISTRADOR';
      email: string;
    };
  }
}
