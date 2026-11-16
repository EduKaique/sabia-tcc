import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify, { type FastifyInstance } from 'fastify';
import { registrarLimiteTentativas, MENSAGEM_LIMITE } from './limite-tentativas.ts';

const CONFIG = { janelaSegundos: 60, authMax: 120, esqueciSenhaMax: 10 };

/** Gateway com rotas fake no lugar dos proxies e relógio controlado pelo teste. */
function criarGateway(config = CONFIG) {
  let instante = 1_000_000;
  const gateway = Fastify({ trustProxy: 1 });
  const limite = registrarLimiteTentativas(gateway, config, () => instante);
  const ok = async () => ({ ok: true });
  gateway.post('/api/auth/login', ok);
  gateway.post('/api/auth/primeiro-acesso', ok);
  gateway.post('/api/auth/esqueci-senha', ok);
  gateway.post('/api/auth/validate', ok);
  gateway.get('/api/publico/convites/:codigo', ok);
  gateway.get('/api/pedagogico/api/aluno/turmas', ok);
  gateway.options('/api/auth/login', ok);
  return {
    gateway,
    avancar: (ms: number) => { instante += ms; },
    fechar: async () => { limite.parar(); await gateway.close(); },
  };
}

function enviar(gateway: FastifyInstance, method: 'GET' | 'POST' | 'OPTIONS', url: string, ip = '198.51.100.1') {
  return gateway.inject({ method, url, remoteAddress: ip });
}

async function repetir(gateway: FastifyInstance, vezes: number, method: 'GET' | 'POST', url: string, ip?: string) {
  for (let i = 0; i < vezes; i++) {
    const resposta = await enviar(gateway, method, url, ip);
    assert.equal(resposta.statusCode, 200, `requisição ${i + 1} de ${url} deveria passar`);
  }
}

test('grupo auth: 120 passam e a 121ª recebe 429 com Retry-After e erro', async () => {
  const { gateway, fechar } = criarGateway();
  await repetir(gateway, 120, 'POST', '/api/auth/login');

  const bloqueada = await enviar(gateway, 'POST', '/api/auth/login');
  assert.equal(bloqueada.statusCode, 429);
  assert.equal(bloqueada.headers['retry-after'], '60');
  assert.equal(bloqueada.json().status, 429);
  assert.equal(bloqueada.json().erro, MENSAGEM_LIMITE);
  assert.ok(bloqueada.json().timestamp);
  await fechar();
});

test('os endpoints do grupo auth compartilham o contador do IP', async () => {
  const { gateway, fechar } = criarGateway({ ...CONFIG, authMax: 2 });
  await repetir(gateway, 1, 'POST', '/api/auth/primeiro-acesso');
  await repetir(gateway, 1, 'GET', '/api/publico/convites/ABC123');
  assert.equal((await enviar(gateway, 'POST', '/api/auth/login')).statusCode, 429);
  await fechar();
});

test('a janela expira e libera de novo', async () => {
  const { gateway, avancar, fechar } = criarGateway({ ...CONFIG, authMax: 1 });
  await repetir(gateway, 1, 'POST', '/api/auth/login');
  assert.equal((await enviar(gateway, 'POST', '/api/auth/login')).statusCode, 429);

  avancar(60_000);
  assert.equal((await enviar(gateway, 'POST', '/api/auth/login')).statusCode, 200);
  await fechar();
});

test('esqueci-senha tem limite próprio (10) e independente do grupo auth', async () => {
  const { gateway, fechar } = criarGateway();
  await repetir(gateway, 10, 'POST', '/api/auth/esqueci-senha');
  assert.equal((await enviar(gateway, 'POST', '/api/auth/esqueci-senha')).statusCode, 429);
  assert.equal((await enviar(gateway, 'POST', '/api/auth/login')).statusCode, 200);
  await fechar();
});

test('IPs diferentes têm contadores separados', async () => {
  const { gateway, fechar } = criarGateway({ ...CONFIG, authMax: 1 });
  await repetir(gateway, 1, 'POST', '/api/auth/login', '198.51.100.1');
  assert.equal((await enviar(gateway, 'POST', '/api/auth/login', '198.51.100.1')).statusCode, 429);
  assert.equal((await enviar(gateway, 'POST', '/api/auth/login', '198.51.100.2')).statusCode, 200);
  await fechar();
});

test('validate, rotas autenticadas e o preflight OPTIONS não são limitados', async () => {
  const { gateway, fechar } = criarGateway({ ...CONFIG, authMax: 1 });
  await repetir(gateway, 5, 'POST', '/api/auth/validate');
  await repetir(gateway, 5, 'GET', '/api/pedagogico/api/aluno/turmas');
  for (let i = 0; i < 5; i++) {
    assert.equal((await enviar(gateway, 'OPTIONS', '/api/auth/login')).statusCode, 200);
  }
  await repetir(gateway, 1, 'POST', '/api/auth/login');
  await fechar();
});

test('com trustProxy 1, um X-Forwarded-For forjado à esquerda não troca a chave', async () => {
  const { gateway, fechar } = criarGateway({ ...CONFIG, authMax: 1 });
  // O Caddy acrescenta o IP real no fim; o cliente controla só o que vem antes.
  const comXff = (forjado: string) => gateway.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: '172.18.0.5',
    headers: { 'x-forwarded-for': `${forjado}, 198.51.100.7` },
  });
  assert.equal((await comXff('203.0.113.1')).statusCode, 200);
  assert.equal((await comXff('203.0.113.2')).statusCode, 429);
  await fechar();
});

test('caminho com barra no fim também conta', async () => {
  const { gateway, fechar } = criarGateway({ ...CONFIG, authMax: 1 });
  await repetir(gateway, 1, 'POST', '/api/auth/login');
  const resposta = await gateway.inject({ method: 'POST', url: '/api/auth/login/', remoteAddress: '198.51.100.1' });
  assert.equal(resposta.statusCode, 429);
  await fechar();
});
