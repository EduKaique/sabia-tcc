# Resultado — Primeiro acesso do aluno: backend base (issues A e B)

Fase 0–1 do primeiro acesso do aluno. Cobre **somente** a issue A (sequences dessincronizadas do seed) e a issue B (validação pública do código de convite). Data da execução: 2026-10-14 (logs em UTC: 2026-10-15T00:3x).

> **Observação:** o documento de análise `docs/analise-primeiro-acesso-aluno.md` (§3.4, §7.1, §8, §12) **não existe no repositório**. Ele não está em nenhuma branch local ou remota nem no histórico do git. Por decisão do responsável, o texto da tarefa foi usado como especificação completa das issues A e B. Convém revisar este resultado quando a análise for adicionada ao repositório.

---

## 1. Leitura prévia (Fase 0)

| Item | Constatação |
|---|---|
| Inicialização SQL | Nos dois serviços (`application-dev.yml`): `ddl-auto: update` + `defer-datasource-initialization: true` + `sql.init.mode: always`. O `data.sql` roda **depois** de o Hibernate criar/atualizar o schema e **a cada reinício**. O schema vem de `currentSchema=auth\|pedagogico` na URL JDBC. |
| Testes do auth | Usam H2 com `sql.init.mode: never`, então o `data.sql` não roda nos testes. Por isso as funções específicas do Postgres no seed não afetam os testes. |
| Tabelas com id fixo no seed + IDENTITY | auth: `instituicao` (1), `usuario` (1–9). pedagogico: `turma` (10), `turma_aluno` (30), **`atividade_avaliativa` (20–22)**. Esta última não era citada na tarefa e foi encontrada na varredura. |
| Sem sequence | `aluno` e `professor` usam `@MapsId` (o id vem do `usuario`). |
| Não semeadas (fora) | `token_recuperacao_senha`, `correcao`, `submissao_seq` e `projeto_scratch_seq` (AUTO). |
| `TurmaRepository` | Tinha só `existsByCodigoConvite`. **`findByCodigoConvite` foi criado.** |
| Erros | `GlobalExceptionHandler` mapeia `ResourceNotFoundException` para 404 no formato `{status, erro, timestamp}`. O mapeamento foi reaproveitado. |
| Controllers | Organizados por pacote de perfil (`controller/professor`, `controller/aluno`), com `@Tag`/`@Operation`. O novo pacote é `controller/publico`. |
| Gateway | `proxy.ts` declara rotas `{upstream, prefix, rewritePrefix, protected?, roles?}`. `/api/pedagogico` usa `rewritePrefix: '/'` (remove o prefixo) e `authenticate`. `/api/auth` mantém o prefixo e não tem preHandler (é o padrão seguido). O CORS é global (`plugins/cors.ts`). |
| Testes | O auth-service tem infraestrutura (JUnit + MockMvc + H2). O **pedagogico-service não tem `src/test`**, só as dependências no pom. Por isso nenhuma infraestrutura nova foi criada (ver §5). |

## 2. Arquivos alterados

### Issue A — sequences
- `auth-service/src/main/resources/data.sql`
  - O aluno 3 passa a ser semeado com `perfil_completo = true`. Um `UPDATE` idempotente corrige bases já existentes (D11).
  - Nova seção 6, que sincroniza `instituicao` e `usuario`.
- `pedagogico-service/src/main/resources/data.sql`
  - Nova seção 6, que sincroniza `turma`, `turma_aluno` e `atividade_avaliativa`.

### Issue B — validação pública do código
- `pedagogico-service/.../controller/publico/PublicoConviteController.java` (novo)
- `pedagogico-service/.../dto/response/ConviteValidoResponse.java` (novo)
- `pedagogico-service/.../service/TurmaService.java`: método `validarCodigoConvite`
- `pedagogico-service/.../repository/TurmaRepository.java`: `findByCodigoConvite`
- `pedagogico-service/.../config/SecurityConfig.java`: `/api/publico/**` adicionado ao `PUBLIC_ENDPOINTS`
- `api-gateway/src/routes/proxy.ts`: rota `/api/publico` para o pedagogico, sem preHandler e sem remover o prefixo

Nada mais foi alterado: schema, web/, docker-compose, alfabeto e regeneração do código continuam iguais, e nenhuma dependência nova foi adicionada.

## 3. Decisões tomadas

1. **SQL sem `DO $$`.** O `ScriptUtils` do Spring divide o script por `;`, e isso quebraria um bloco PL/pgSQL. Cada tabela tem um único `SELECT setval(...)`:
   ```sql
   SELECT CASE WHEN alvo > 0 THEN setval(seq, alvo, true) ELSE setval(seq, 1, false) END
   FROM (
       SELECT s.seq,
              GREATEST(COALESCE((SELECT MAX(id) FROM usuario), 0), COALESCE(ps.last_value, 0)) AS alvo
       FROM (SELECT pg_get_serial_sequence('usuario', 'id') AS seq) s
       LEFT JOIN pg_sequences ps ON format('%I.%I', ps.schemaname, ps.sequencename) = s.seq
   ) x;
   ```
   - `pg_get_serial_sequence` resolve a sequence da coluna IDENTITY sem fixar o nome no código.
   - **A sequence nunca recua:** o alvo é `max(MAX(id), last_value)`. `last_value` é NULL em sequence nunca usada, e o `COALESCE` trata esse caso.
   - O `setval(..., true)` deixa `nextval = alvo + 1` e mantém o `last_value` visível em `pg_sequences`.
   - Uma tabela vazia com sequence nunca usada fica em `setval(seq, 1, false)`, ou seja, o próximo id é 1.
   - É idempotente: reexecutar com os mesmos dados produz o mesmo alvo.
2. **Por que nunca recuar:** não há FK entre schemas. Reaproveitar o id de um usuário apagado poderia associar linhas órfãs de `pedagogico.turma_aluno` a um aluno novo. O motivo está registrado em comentário nos dois `data.sql`.
3. **`atividade_avaliativa` incluída**, porque a tarefa pedia para varrer todas as tabelas do seed.
4. **D11:** o aluno 3 tem só `perfil_completo = true`. **A matrícula continua nula**, por decisão do responsável. O `UPDATE` tem guarda (`AND perfil_completo = false`) para ser idempotente.
5. **Mensagem única de 404** (`"Código de turma inválido. Verifique com seu professor."`) para formato inválido e para código inexistente. Ela fica numa constante e reaproveita `ResourceNotFoundException` e o handler global.
6. **Normalização:** `trim().toUpperCase(Locale.ROOT)` (para não depender do locale do servidor), seguida da validação `^[A-Z0-9]{6}$`. Uma entrada fora do formato nem chega ao banco.
7. **Cache:**
   - 200 → `Cache-Control: no-store`, via `CacheControl.noStore()` no controller.
   - 404 → o padrão do Spring Security, `no-cache, no-store, max-age=0, must-revalidate`, que também impede cache.
8. **Sem log do código** no código da aplicação. Os logs do framework/gateway são preexistentes; ver riscos.
9. **Gateway:** a rota `/api/publico` foi registrada com `rewritePrefix: '/api/publico'` (sem remoção de prefixo) e sem `protected`/`roles`, no mesmo padrão de `/api/auth`. A rota `/api/pedagogico` não foi tocada.
10. **Validação da base nova:** o volume `sabia-tcc_postgres_data` foi recriado, por decisão do responsável. O `rabbitmq_data` foi preservado. Antes disso, o ambiente não tinha nenhum container nem volume. Por isso o "antes" abaixo foi obtido subindo a stack com o código original.

## 4. Evidências

### 4.1 Build
| Módulo | Comando (em container `eclipse-temurin:21-jdk-alpine` / `node:22-alpine`; a máquina não tem JDK/Node no PATH) | Resultado |
|---|---|---|
| pedagogico-service | `./mvnw -B -DskipTests package` | OK (`pedagogico-service-0.0.1-SNAPSHOT.jar`) |
| auth-service | `./mvnw -B test` | **BUILD SUCCESS, 31 testes, 0 falhas** |
| api-gateway | `npm ci && npx tsc --noEmit -p .` | exit 0 |
| Imagens docker | `docker compose up -d --build auth-service pedagogico-service api-gateway` | OK; os três serviços sobem |

### 4.2 Issue A — `pg_sequences` (somente SELECT)

Consulta usada em todas as rodadas:
```sql
SELECT schemaname, sequencename, last_value FROM pg_sequences WHERE schemaname IN ('auth','pedagogico');
-- + max(id) de cada tabela semeada + aluno 3
```

| Sequence | max(id) | **Antes** (código original, base nova) | Base existente após o deploy da correção | Base recém-criada | Após reinício 1 | Após reinício 2 |
|---|---|---|---|---|---|---|
| auth.instituicao_id_seq | 1 | NULL (nextval = 1, colide) | 1 | 1 | 1 | 1 |
| auth.usuario_id_seq | 9 | NULL (nextval = 1, colide) | 9 | 9 | 9 | 9 |
| pedagogico.turma_id_seq | 10 | NULL (nextval = 1) | 10 | 10 | 10 | 10 |
| pedagogico.turma_aluno_id_seq | 30 | NULL (nextval = 1) | 30 | 30 | 30 | 30 |
| pedagogico.atividade_avaliativa_id_seq | 22 | NULL (nextval = 1) | 22 | 22 | 22 | 22 |
| auth.aluno id 3: `perfil_completo` | — | `f` | `t` | `t` | `t` | `t` |

- Em `pg_sequences`, `last_value` não nulo significa `is_called = true`, portanto `nextval = last_value + 1 > max(id)` em todas as sequences.
- O `last_value` não diminui entre as rodadas.
- As sequences não semeadas (`token_recuperacao_senha_id_seq`, `correcao_id_seq`, `submissao_seq`, `projeto_scratch_seq`) continuam intocadas (NULL).

**Teste de não recuo** (Postgres 16 descartável, fora da base compartilhada, com a mesma instrução do seed):

| Passo | last_value / is_called |
|---|---|
| tabela vazia, sequence nunca usada | 1 / f (próximo id = 1) |
| seed com ids 1..9 | 9 / t |
| app insere ids 10 e 11, depois apaga os dois | — |
| "reinício" (sync executado 2×) com max(id) = 9 | **11 / t**, não recuou para 9 |
| próximo INSERT da aplicação | id **12** |

### 4.3 Issue B — via gateway (`:8000`)

| Requisição | Status | Cache-Control | Corpo |
|---|---|---|---|
| `GET /api/publico/convites/SABIA1` | **200** | `no-store` | `{"codigo":"SABIA1","turmaNome":"Programação I — 2025/1"}` |
| `GET /api/publico/convites/sabia1` | **200** | `no-store` | idem |
| `GET /api/publico/convites/%20SABIA1%20` | **200** | `no-store` | idem |
| `GET /api/publico/convites/ZZZZZZ` (inexistente) | **404** | `no-cache, no-store, max-age=0, must-revalidate` | `{"status":404,"erro":"Código de turma inválido. Verifique com seu professor.","timestamp":"…"}` |
| `GET /api/publico/convites/SABIA1234` (longo) | **404** | idem | mesma mensagem |
| `GET /api/publico/convites/SAB-A!` (especiais) | **404** | idem | mesma mensagem |
| `GET /api/publico/convites/%C3%87ABIA1` (`ÇABIA1`) | **404** | idem | mesma mensagem |
| `OPTIONS …/SABIA1` com `Origin: http://localhost:3000` | **204** | — | `access-control-allow-origin: http://localhost:3000`, métodos GET…OPTIONS |
| `GET …/SABIA1` com `Origin: http://localhost:3000` | **200** | `no-store` | `access-control-allow-origin: http://localhost:3000` presente |
| `GET /api/pedagogico/api/professor/turmas` sem token | **401** | — | `{"statusCode":401,"error":"Unauthorized","message":"Token inválido ou ausente."}` |
| `GET /api/pedagogico/api/publico/convites/SABIA1` sem token | **401** | — | o caminho via `/api/pedagogico` continua protegido |

A resposta 200 contém **apenas** `codigo` e `turmaNome`.

**OpenAPI** (`:8081/v3/api-docs`):
- `/api/publico/convites/{codigo}` aparece com a tag "Público — Convites" e sem `security`;
- o schema `ConviteValidoResponse` tem só `codigo` e `turmaNome`.

## 5. Riscos e pendências

- **Endpoint público sem rate limiting até a issue G.** Hoje é possível enumerar códigos por força bruta (36⁶ ≈ 2,2 bilhões de combinações, sem limite de tentativas). A issue G deve cobrir pelo menos `/api/publico/**` no gateway.
- **Código de convite nos logs (preexistente, não alterado):**
  - o perfil `dev` do pedagogico tem `org.springframework.web: DEBUG`, e o `DispatcherServlet` registra `GET "/api/publico/convites/ZZZZZZ"`;
  - o `logger: true` do Fastify registra a URL de cada requisição;
  - o código da aplicação não registra nada;
  - sugestão: tratar junto com a issue G ou numa revisão de logs em produção.
- **Firewall do Spring (preexistente):** certos caracteres codificados (`%2F`, `%3B`, `%25`, `\`) são barrados pelo `StrictHttpFirewall` antes do controller e retornam **400**, não 404. Não vaza informação sobre códigos, mas foge da regra "sempre 404".
- **pedagogico-service sem testes:** não há `src/test`. Conforme a tarefa, nenhuma infraestrutura nova foi criada. Os casos de B (200 em maiúsculas/minúsculas, 404 para inexistente/formato inválido, corpo sem campos extras) foram verificados só por curl (§4.3). Criar a infraestrutura de testes do pedagogico é uma pendência.
- **Acesso direto ao serviço sem token** (`:8081/api/professor/turmas`) retorna **403** em vez de 401, porque não há `AuthenticationEntryPoint` configurado. É preexistente e foi apenas registrado. Pelo gateway, a resposta é 401.
- **Aluno 3 sem matrícula:** `perfil_completo = true` com `matricula` nula (D11, decisão consciente). Telas que exibem a matrícula devem tolerar o valor nulo.
- **`UPDATE` do aluno 3 roda a cada reinício:** se alguém marcar o aluno 3 como incompleto manualmente para testar, o próximo reinício volta a marcar como completo. É o mesmo comportamento dos demais seeds.
- **O seed depende do Postgres** (`pg_get_serial_sequence`, `pg_sequences`, `setval`). Hoje não há impacto, porque o perfil de teste usa `sql.init.mode: never`. Se algum teste futuro habilitar o seed em H2, ele vai falhar.
- **A análise de referência não estava disponível** (ver o topo deste documento).

## 6. Descrições de PR

### PR — Issue A

**Título:** `fix(seed): sincroniza sequences com os ids fixos do data.sql`

```markdown
## Contexto
Os `data.sql` do auth-service e do pedagogico-service inserem registros com id fixo, o que
não avança as sequences IDENTITY. Em base nova, o primeiro INSERT feito pela aplicação
(ex.: cadastro de usuário, criação de turma) recebia id 1 e colidia com o seed.

## O que muda
- Ao fim de cada `data.sql`, um `SELECT setval(...)` por tabela semeada com id fixo:
  - auth: `instituicao`, `usuario`
  - pedagogico: `turma`, `turma_aluno`, `atividade_avaliativa`
- Alvo = maior valor entre `max(id)` e o `last_value` atual. **A sequence nunca recua**:
  como não há FK entre schemas, reaproveitar ids apagados poderia associar linhas órfãs
  de `turma_aluno` a um aluno novo.
- Idempotente (o seed roda a cada reinício) e sem bloco `DO $$` (o Spring divide o script por `;`).
- Seed do aluno 3 com `perfil_completo = true` (D11), com `UPDATE` idempotente para bases existentes.

## Como testar
1. `docker compose up -d --build` em base nova.
2. `SELECT schemaname, sequencename, last_value FROM pg_sequences WHERE schemaname IN ('auth','pedagogico');`
   → `last_value` = `max(id)` de cada tabela semeada.
3. Reiniciar `auth-service` e `pedagogico-service` duas vezes → valores iguais (não recuam).

Evidências: `docs/resultado-primeiro-acesso-backend-base.md` §4.2.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### PR — Issue B

**Título:** `feat(pedagogico): validação pública do código de convite (HU003.1)`

```markdown
## Contexto
HU003.1: o aluno acessa `/convite/[codigo]` antes de estar autenticado. O front precisa
confirmar que o código existe e mostrar o nome da turma, sem expor outros dados.

## O que muda
**pedagogico-service**
- `GET /api/publico/convites/{codigo}` (`PublicoConviteController`), liberado em
  `SecurityConfig` via `/api/publico/**`. Nenhuma outra regra foi alterada.
- Entrada normalizada com `trim().toUpperCase()`. Fora de `^[A-Z0-9]{6}$` ou inexistente → 404
  com a mesma mensagem: "Código de turma inválido. Verifique com seu professor."
- 200 → `{"codigo": "...", "turmaNome": "..."}` com `Cache-Control: no-store`. Sem ids,
  professor, instituição ou contagem.
- `TurmaRepository.findByCodigoConvite`.

**api-gateway**
- Rota `/api/publico` → pedagogico, sem preHandler de autenticação e sem remover o prefixo.
  `/api/pedagogico/**` continua 100% protegido.

## Fora de escopo
- Rate limiting: **o endpoint fica sem limite até a issue G.**
- Primeiro acesso atômico (issue C).

## Como testar
- `curl -i :8000/api/publico/convites/SABIA1` → 200 + `Cache-Control: no-store`
- `sabia1` e `%20SABIA1%20` → 200
- `ZZZZZZ`, `SABIA1234`, `SAB-A!` → 404 com a mensagem padrão
- `curl -i :8000/api/pedagogico/api/professor/turmas` sem token → 401

Evidências: `docs/resultado-primeiro-acesso-backend-base.md` §4.3.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
