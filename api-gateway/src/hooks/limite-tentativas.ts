import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { normalizar } from '../middlewares/block-paths.ts';

/**
 * Limite de tentativas por IP nos endpoints públicos de acesso (força bruta de senha, código de
 * convite, token de redefinição e envio de e-mail). Contador em memória com janela fixa: vale
 * para uma única instância do gateway e zera quando ele reinicia. O limite por conta fica no
 * auth-service, porque o proxy não lê o corpo da requisição.
 */
export type ConfigLimiteTentativas = {
  janelaSegundos: number;
  authMax: number;
  esqueciSenhaMax: number;
};

type Grupo = 'auth' | 'esqueci-senha';
type Contador = { contagem: number; fimJanela: number };

const CAMINHOS_AUTH = new Set([
  '/api/auth/login',
  '/api/auth/primeiro-acesso',
  '/api/auth/redefinir-senha',
  '/api/auth/trocar-senha',
]);
const PREFIXO_CONVITES = '/api/publico/convites/';
const CAMINHO_ESQUECI_SENHA = '/api/auth/esqueci-senha';

/** Teto de chaves (grupo + IP) em memória. */
export const MAX_CHAVES = 10_000;

export const MENSAGEM_LIMITE = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';

function grupoDe(request: FastifyRequest): Grupo | null {
  if (request.method === 'OPTIONS') return null; // preflight do CORS não conta
  const caminho = normalizar(request.url.split('?')[0])?.replace(/\/$/, '');
  if (!caminho) return null;
  if (caminho === CAMINHO_ESQUECI_SENHA) return 'esqueci-senha';
  if (CAMINHOS_AUTH.has(caminho) || caminho.startsWith(PREFIXO_CONVITES)) return 'auth';
  return null;
}

export function registrarLimiteTentativas(
  gateway: FastifyInstance,
  config: ConfigLimiteTentativas,
  agora: () => number = Date.now,
): { parar: () => void } {
  const janelaMs = config.janelaSegundos * 1000;
  const maximo: Record<Grupo, number> = {
    auth: config.authMax,
    'esqueci-senha': config.esqueciSenhaMax,
  };
  const contadores = new Map<string, Contador>();

  const limparExpirados = () => {
    const instante = agora();
    for (const [chave, contador] of contadores) {
      if (contador.fimJanela <= instante) contadores.delete(chave);
    }
  };
  const timer = setInterval(limparExpirados, janelaMs);
  timer.unref();

  gateway.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const grupo = grupoDe(request);
    if (!grupo) return;

    const chave = `${grupo}:${request.ip}`;
    const instante = agora();
    let contador = contadores.get(chave);
    if (!contador || contador.fimJanela <= instante) {
      if (!contador && contadores.size >= MAX_CHAVES) {
        limparExpirados();
        // Ainda cheio: descarta a chave mais antiga (ordem de inserção do Map).
        if (contadores.size >= MAX_CHAVES) contadores.delete(contadores.keys().next().value!);
      }
      contador = { contagem: 0, fimJanela: instante + janelaMs };
      contadores.set(chave, contador);
    }

    contador.contagem++;
    if (contador.contagem > maximo[grupo]) {
      const segundos = Math.max(1, Math.ceil((contador.fimJanela - instante) / 1000));
      return reply
        .code(429)
        .header('Retry-After', String(segundos))
        .send({ status: 429, erro: MENSAGEM_LIMITE, timestamp: new Date().toISOString() });
    }
  });

  return { parar: () => clearInterval(timer) };
}
