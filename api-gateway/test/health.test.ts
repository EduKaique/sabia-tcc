import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { registerHealthCheck } from '../src/routes/health.ts';

test('health responde só o status, sem URLs internas', async () => {
  const gateway = Fastify();
  registerHealthCheck(gateway);

  const resposta = await gateway.inject({ method: 'GET', url: '/health' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.json(), { status: 'ok' });
  await gateway.close();
});
