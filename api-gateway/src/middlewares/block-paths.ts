import type { FastifyRequest, FastifyReply } from 'fastify';
import { NotFoundError } from '../hooks/errors.ts';

/**
 * Responde 404 quando o caminho contém algum dos trechos bloqueados. A comparação usa o
 * caminho decodificado, em minúsculas e sem barras repetidas, para não ser contornada
 * com %-encoding ou "//".
 */
export function blockPaths(...trechos: string[]) {
  const bloqueados = trechos.map((t) => t.toLowerCase());
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const caminho = normalizar(request.url.split('?')[0]);
    if (caminho === null || bloqueados.some((t) => caminho.includes(t))) {
      throw new NotFoundError();
    }
  };
}

function normalizar(caminho: string): string | null {
  try {
    return decodeURIComponent(caminho).toLowerCase().replace(/\/{2,}/g, '/');
  } catch {
    return null; // %-encoding malformado: trata como bloqueado
  }
}
