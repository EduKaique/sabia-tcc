const DEV_JWT_SECRET = 'dev-secret-change-in-production-must-be-at-least-32-chars';

// Defaults conhecidos do repositório: nunca aceitos em produção.
const SEGREDOS_CONHECIDOS = [
  DEV_JWT_SECRET,
  'dev-secret-change-me',
  'test-secret-test-secret-test-secret-test-secret',
];

function jwtSecret(): string {
  const segredo = process.env.JWT_SECRET;
  if (process.env.NODE_ENV !== 'production') return segredo || DEV_JWT_SECRET;

  if (!segredo) throw new Error('JWT_SECRET é obrigatório quando NODE_ENV=production.');
  if (Buffer.byteLength(segredo, 'utf8') < 32) {
    throw new Error('JWT_SECRET deve ter no mínimo 32 bytes quando NODE_ENV=production.');
  }
  if (SEGREDOS_CONHECIDOS.includes(segredo)) {
    throw new Error('JWT_SECRET não pode ser um valor default do repositório em produção.');
  }
  return segredo;
}

/** Inteiro positivo da variável; senão o padrão. */
function inteiroPositivo(nome: string, padrao: number): number {
  const valor = Number(process.env[nome]);
  return Number.isInteger(valor) && valor > 0 ? valor : padrao;
}

export const env = {
  PORT: Number(process.env.GATEWAY_PORT) || 8000,
  JWT_SECRET: jwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  limiteTentativas: {
    janelaSegundos: inteiroPositivo('RATE_LIMIT_JANELA_SEGUNDOS', 60),
    authMax: inteiroPositivo('RATE_LIMIT_AUTH_MAX', 120),
    esqueciSenhaMax: inteiroPositivo('RATE_LIMIT_ESQUECI_SENHA_MAX', 10),
  },
  upstreams: {
    auth: process.env.AUTH_URL || 'http://localhost:8080',
    pedagogico: process.env.PEDAGOGICO_URL || 'http://localhost:8081',

  },
};
