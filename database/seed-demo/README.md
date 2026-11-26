# Seed de demonstração (apresentação)

Dados fictícios pré-cadastrados para a apresentação, em dev e prod. É **adicional** aos seeds existentes
(`auth-service/.../data.sql` e `pedagogico-service/.../data.sql`, só dev), que não mudam.

## Como funciona

- Cada serviço tem `src/main/resources/seed-demo.sql`, carregado por `config/SeedDemoRunner` (um `ApplicationRunner`)
  **depois** do Hibernate criar/atualizar as tabelas. Funciona em qualquer perfil, inclusive `prod` (onde o `data.sql` não roda).
- Só `INSERT ... ON CONFLICT DO NOTHING`: subir N vezes não duplica e **nunca altera nem apaga** dado existente.
- Os comandos são separados por uma linha `@@FIM@@` (e não por `;`, que aparece em HTML e JSON).
- Transação única. Se falhar: rollback, `ERROR SEED_DEMO_FALHOU` no log e o serviço **sobe normalmente**.
- Auth e pedagogico se ligam por id (sem FK entre schemas), então os dois arquivos usam os mesmos ids de professor e aluno.

## Switch

`SABIA_SEED_DEMO=true|false` (padrão `false` na aplicação; `true` em `docker-compose.yml` e `docker-compose.prod.yml`).

**Para desligar depois da apresentação:** defina `SABIA_SEED_DEMO=false` (no `.env.prod` do servidor, ou troque o padrão
`:-true` nos compose) e recrie `auth-service` e `pedagogico-service`. Desligar **não remove** o que já foi inserido; para isso use
`remover-demo.sql`.

## Faixa de ids reservada (>= 9.000.000)

As sequences nunca são alteradas pelo seed e continuam abaixo da faixa. Os `setval` do `data.sql` ignoram ids >= 9.000.000.

| Schema | Tabela | Ids |
|---|---|---|
| auth | instituicao | 9.000.001 |
| auth | usuario / professor | 9.000.001 – 9.000.002 |
| auth | usuario / aluno | 9.000.011 – 9.000.016 |
| pedagogico | turma | 9.100.001+ |
| pedagogico | turma_aluno | 9.200.001+ |
| pedagogico | atividade_avaliativa | 9.300.001+ |
| pedagogico | submissao_avaliativa | 9.400.001+ |
| pedagogico | projeto_avaliativo | 9.500.001+ |
| pedagogico | correcao | 9.600.001+ |
| pedagogico | licao | 9.700.001+ |
| pedagogico | licao_turma | 9.710.001+ |
| pedagogico | pagina_licao | 9.720.001+ |
| pedagogico | progresso_licao | 9.730.001+ |
| pedagogico | progresso_pagina | 9.740.001+ |
| pedagogico | cenario_robo | 9.900.001+ |
| pedagogico | projeto_sandbox | 9.950.001+ |

Ids abaixo de 2^53 (limite de precisão do JavaScript no front).

## Remoção

`remover-demo.sql` apaga só a faixa reservada e o que aponta para ela, nos dois schemas, em uma transação, com a contagem
esperada em comentário antes de cada `DELETE`. **Não é executado automaticamente.** Faça backup antes.

## Contas

Todas fictícias (`@sabia.demo`, matrículas `DEMO000x`, nomes com sufixo "(Demo)"). As senhas são aleatórias (16 caracteres)
e **não estão neste repositório**; só o hash BCrypt está no seed.
