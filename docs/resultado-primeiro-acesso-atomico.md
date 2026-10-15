# Resultado — Primeiro acesso atômico do aluno (issue C — HU003.2)

Somente backend: auth-service, pedagogico-service, api-gateway e a variável `PEDAGOGICO_URL` no docker-compose. O `web/` não foi alterado. Data da execução: 2026-10-14 (logs em UTC: 2026-10-15T01:1x).

> **Observações:**
> - `docs/analise-primeiro-acesso-aluno.md` continua inexistente no repositório. O contrato usado foi o do enunciado da tarefa.
> - Nesta branch (`feat/fluxo-aluno-completo`), as mudanças das issues A e B ainda estão no working tree, sem commit. A issue C foi construída por cima delas. Ao separar os PRs, a C depende de A + B.

---

## 1. Fluxo implementado

```
web ──POST /api/auth/primeiro-acesso──▶ gateway (/api/auth, público) ──▶ auth-service
                                                                             │ 0. regras locais (senhas, avatar, idade)
                                                                             │ 1. GET  /api/interno/turmas/por-codigo/{codigo}   ─┐ token SISTEMA (60 s)
                                                                             │ 2. duplicidade e-mail (ignore case) / matrícula   │ RestClient 2 s / 5 s
                                                                             │ 3. saveAndFlush(usuario) + saveAndFlush(aluno)    │
                                                                             │ 4. POST /api/interno/turmas/{id}/alunos          ─┘ falhou → rollback local
                                                                             │ 5. JWT (mesmo do login)
                                                                             ◀── 201 {token, tipo, perfil, nome, mustChangePassword, turma:{nome}}
```

## 2. Arquivos alterados

### pedagogico-service
| Arquivo | Mudança |
|---|---|
| `controller/interno/InternoTurmaController.java` (novo) | `GET /api/interno/turmas/por-codigo/{codigo}` → 200 `{turmaId, turmaNome}` / 404. `POST /api/interno/turmas/{turmaId}/alunos` `{alunoId, alunoNome}` → 201 / 404 (turma) / 409 (vínculo já existe). |
| `dto/response/TurmaPorCodigoResponse.java` (novo) | `{turmaId, turmaNome}` |
| `service/TurmaService.java` | A lógica da issue B foi extraída para `buscarPorCodigoConvite` (normaliza + `^[A-Z0-9]{6}$` + mesma mensagem 404), usada pelo endpoint público e pelo interno, sem duplicar código. |
| `service/TurmaAlunoService.java` | A lógica de `matricular` foi extraída para `vincular(Turma, request)`. Isso inclui o 409 por `exists` e por corrida de `DataIntegrityViolationException`. `matricular` (professor) e `matricularPeloSistema` (sem checagem de professor) usam esse método. |
| `config/SecurityConfig.java` | `/api/interno/**` → `hasRole("SISTEMA")`. Nenhuma outra regra mudou. |

### auth-service
| Arquivo | Mudança |
|---|---|
| `model/usuario/Usuario.java` | `cpf` passa a ser nullable (mantém `unique` e `length = 11`). Uma guarda em `@PrePersist`/`@PreUpdate` exige CPF para todo perfil ≠ ALUNO. |
| `model/usuario/AvatarCatalogo.java` (novo) | Catálogo único com os 8 ids `sabia-*` |
| `security/JwtTokenProvider.java` | `generateServiceToken()`: `sub = "0"`, `perfil = "SISTEMA"`, validade de 60 s. Também `isServiceToken(claims)`. |
| `security/JwtAuthFilter.java` | Token SISTEMA não autentica no auth-service. |
| `service/AuthService.java` | Login com `findByEmailIgnoreCase`; `/validate` devolve `valido:false` para token SISTEMA. |
| `dto/request/LoginRequest.java` | E-mail normalizado (`trim` + minúsculas, `Locale.ROOT`) no construtor do record. |
| `client/PedagogicoClient.java` (novo) | `RestClient` (spring-web) com timeouts de 2 s (conexão) e 5 s (leitura). 404 → `CodigoTurmaInvalidoException`. Conexão, timeout, 5xx ou resposta inesperada → `PedagogicoIndisponivelException`. |
| `service/PrimeiroAcessoService.java` (novo) | Fluxo `@Transactional` descrito no §1 |
| `dto/request/PrimeiroAcessoRequest.java` (novo) | Bean Validation; normaliza código (maiúsculas), nome, matrícula, avatar e e-mail (minúsculas). O `toString()` omite os dados (§6). |
| `dto/response/PrimeiroAcessoResponse.java` (novo) | Campos do `LoginResponse` + `turma: { nome }` |
| `exception/CodigoTurmaInvalidoException`, `PedagogicoIndisponivelException`, `CadastroDuplicadoException`, `CampoInvalidoException` (novos) + `GlobalExceptionHandler.java` | 404 / 503 / 409 com `campos` / 400 com `campos` |
| `repository/UsuarioRepository.java`, `AlunoRepository.java` | `findByEmailIgnoreCase`, `existsByEmailIgnoreCase`, `existsByMatricula` |
| `controller/AuthController.java` | `POST /api/auth/primeiro-acesso` → 201 |
| `config/SecurityConfig.java` | `/api/auth/primeiro-acesso` incluído em `PUBLIC_ENDPOINTS` |
| `resources/application.yml` | `sabia.pedagogico.url: ${PEDAGOGICO_URL:http://pedagogico-service:8081}` |
| `resources/data.sql` | No início do arquivo: `ALTER TABLE usuario ALTER COLUMN cpf DROP NOT NULL;` (idempotente) |
| `test/.../PrimeiroAcessoControllerTest.java` (novo), `test/resources/application-test.yml` | 16 testes; URL fictícia do pedagogico (o cliente é mockado) |

### api-gateway
| Arquivo | Mudança |
|---|---|
| `src/middlewares/block-paths.ts` (novo) | 404 quando o caminho, decodificado, em minúsculas e com barras repetidas colapsadas, contém um trecho bloqueado. %-encoding malformado também é bloqueado. |
| `src/routes/proxy.ts` | Rota `/api/pedagogico` com `blockedPaths: ['/api/interno']`. O bloqueio roda **antes** da autenticação (404 com ou sem token). Os preHandlers são compostos numa única função, porque o `@fastify/http-proxy` aceita só uma. |

### docker-compose.yml
- `auth-service.environment`: `PEDAGOGICO_URL: ${PEDAGOGICO_URL:-http://pedagogico-service:8081}`. O nome do serviço foi confirmado no compose; nenhuma porta mudou.

## 3. Decisões

1. **Token de serviço com `sub = "0"`.** O `JwtAuthFilter` do pedagogico faz `Long.parseLong(sub)` e transforma a claim `perfil` em `ROLE_<perfil>`. Um `sub` não numérico derrubaria o filtro. O id 0 nunca existe, porque a sequence IDENTITY começa em 1.
2. **SISTEMA não existe em `PerfilUsuario`.** Por isso `/login` (que usa `usuario.getTipoPerfil()`) nunca pode emiti-lo. `/validate` não emite token; agora também responde `valido:false` para tokens SISTEMA. No auth-service, um token SISTEMA não autentica (`/me` → 403).
3. **CPF obrigatório fora do aluno.** O auth-service **não tem** fluxo de cadastro de professor nem de diretor, e **não existe perfil DIRETOR** (o enum é `ADMINISTRADOR, PROFESSOR, ALUNO`). Para manter a regra sem depender de fluxos futuros, a guarda ficou na entidade e vale para qualquer gravação. Ela também impede remover o CPF de um professor existente.
4. **Regras locais antes de qualquer I/O:** senhas divergentes (422), avatar fora do catálogo (400) e nascimento há mais de 120 anos (400). `@Past` cobre a data futura. Um código fora do formato vira 404 sem chamar o pedagogico.
5. **409 com `campos`** usa a nova `CadastroDuplicadoException`. A `MatriculaJaCadastradaException` legada continua igual, então o `PUT /api/auth/perfil` não muda de comportamento. Na corrida entre dois cadastros, a `DataIntegrityViolationException` do `saveAndFlush` é mapeada pelo nome da coluna (`matricula`/`email`) na causa; um caso não reconhecido sobe como 500.
6. **Rollback e janela residual:**
   - Uma falha no passo 4 lança exceção, então nenhum usuário/aluno fica gravado.
   - Se a matrícula remota falhar ou ficar incerta (ex.: timeout de leitura depois de o pedagogico gravar), há um WARN só com ids.
   - Se o commit local falhar depois de o passo 4 dar certo, uma `TransactionSynchronization` registra o WARN `turma_aluno órfão (turma id=…, aluno id=…)`.
   - O `alunoId` órfão nunca é reutilizado, porque as sequences não recuam (issue A).
7. **E-mail:** é normalizado no record (`LoginRequest` e `PrimeiroAcessoRequest`), e o login e a checagem de unicidade usam busca case-insensitive. Os e-mails do seed (9) estão todos em minúsculas; nenhum precisou de ajuste.
8. **Instituição do aluno novo fica nula**, porque o endpoint interno devolve só `{turmaId, turmaNome}`. Ver pendências.

## 4. CPF: pontos verificados (Fase 0, item 2)

| Local | Uso | CPF nulo causa NPE/erro? | Ação |
|---|---|---|---|
| `Usuario.cpf` | `@Column(nullable = false)` | **Sim**: o INSERT do aluno sem CPF falharia | Coluna nullable + guarda por perfil + `ALTER` no `data.sql` |
| `PerfilService.completarPerfil` | `request.cpf().equals(usuario.getCpf())` | Não: `request.cpf()` é `@NotBlank`, e `equals(null)` dá `false` | Nenhuma (legado mantido) |
| `PerfilService` | `existsByCpf(request.cpf())`, `setCpf(...)` | Não | Nenhuma |
| `AlunoService.buscar` | `findByCpf(termo)` | Não: o aluno sem CPF só não é achado por CPF (continua achado por e-mail/matrícula) | Nenhuma |
| `PerfilRequest` | `@NotBlank @Size(11)` | Não se aplica ao primeiro acesso | Nenhuma (legado) |
| DTOs de resposta (`MeResponse`, `LoginResponse`, `AlunoBuscaResponse`, `ValidateResponse`) | Não expõem CPF | Não | Nenhuma |
| pedagogico-service | **Nenhum uso de CPF** | Não | Nenhuma |
| api-gateway `routes/auth.ts` (`POST /login`, fora do proxy) | `sub: auth.cpf` | Preexistente e inalcançável: chama `${AUTH_URL}/login`, que não existe no auth-service (o real é `/api/auth/login`) | Só registrado (§7) |

**SQL manual para ambientes que não rodam o `data.sql`:**
```sql
ALTER TABLE auth.usuario ALTER COLUMN cpf DROP NOT NULL;
```
O comando é idempotente, mantém a constraint UNIQUE e roda antes de subir a versão nova do auth-service.

## 5. Evidências

### 5.1 Build e testes automatizados
| Módulo | Comando (containers `eclipse-temurin:21-jdk-alpine` / `node:22-alpine`) | Resultado |
|---|---|---|
| auth-service | `./mvnw -B test` | **47 testes, 0 falhas** (31 existentes + 16 novos), BUILD SUCCESS |
| pedagogico-service | `./mvnw -B -DskipTests package` | OK (sem infraestrutura de testes; não foi criada) |
| api-gateway | `npm ci && npx tsc --noEmit` | exit 0 |

`PrimeiroAcessoControllerTest` usa H2, MockMvc e `@MockitoBean PedagogicoClient`:

| Teste | Verifica |
|---|---|
| `primeiroAcesso_comDadosValidos_retorna201TokenEPersisteAlunoSemCpf` | 201; token válido (`/me` → ALUNO); usuário com e-mail em minúsculas, CPF nulo, data e BCrypt; aluno com matrícula, avatar, `perfilCompleto`, pontuação 0; `matricular(10, id, nome)` chamado |
| `primeiroAcesso_comCodigoInexistente_retorna404SemCriarNada` | 404 com a mensagem da issue B; nada gravado; sem matrícula |
| `primeiroAcesso_comCodigoForaDoFormato_retorna404SemChamarPedagogico` | 404; nenhuma chamada ao cliente |
| `primeiroAcesso_comFalhaNaMatricula_fazRollbackERetorna503` | **rollback**: 0 usuários e 0 alunos; 503 |
| `primeiroAcesso_comPedagogicoIndisponivelNaBusca_retorna503SemCriarNada` | 503; nada gravado |
| `primeiroAcesso_comEmailJaCadastradoEmMaiusculas_retorna409CampoEmail` | 409 `campos.email` |
| `primeiroAcesso_comMatriculaJaCadastrada_retorna409CampoMatricula` | 409 `campos.matricula` |
| `primeiroAcesso_comAvatarForaDoCatalogo_retorna400CampoAvatar` | 400 `campos.avatar` |
| `primeiroAcesso_comSenhasDivergentes_retorna422` | 422 "As senhas não coincidem." |
| `primeiroAcesso_comDataDeNascimentoFutura_retorna400` / `…HaMaisDe120Anos_retorna400` | 400 `campos.dataNascimento` |
| `primeiroAcesso_comCamposObrigatoriosFaltando_retorna400PorCampo` | 400 com os 8 campos |
| `login_aposPrimeiroAcesso_comEmailEmMaiusculas_retorna200` | login case-insensitive |
| `cpf_continuaObrigatorioParaProfessorEAdministrador` / `cpf_naoPodeSerRemovidoDeProfessorExistente` | guarda de CPF |
| `tokenDeServico_naoAutenticaNoAuthServiceENaoEhValidadoComoSessao` | `/me` → 403; `/validate` → `valido:false` |

### 5.2 Em execução (curl pelo gateway `:8000`, base de dev)

Antes do deploy, `auth.usuario.cpf` tinha `is_nullable = NO`. Depois do deploy, **`YES`** (efeito do `ALTER` no `data.sql`). O `PEDAGOGICO_URL` dentro do container era `http://pedagogico-service:8081`.

**1. Caminho feliz**
```
POST /api/auth/primeiro-acesso  {"codigoTurma":" sabia1 ", …, "email":" Teste.PrimeiroAcesso@Sabia.EDU "}
→ 201 {"token":"<jwt>","tipo":"Bearer","perfil":"ALUNO","nome":"Teste Primeiro Acesso","mustChangePassword":false,"turma":{"nome":"Programação I — 2025/1"}}
POST /api/auth/login {"email":"Teste.PrimeiroAcesso@Sabia.EDU", …}  → 200 (perfil ALUNO)
GET  /api/pedagogico/api/aluno/atividades (token do aluno novo)      → 200, 2 itens: 21 "Projeto Final — Animação", 22 "Quiz — Conceitos de Algoritmos"
```
(O rascunho, id 20, corretamente não aparece para o aluno.)

```
 auth.usuario/aluno: id 10 | teste.primeiroacesso@sabia.edu | cpf_nulo t | ALUNO | perfil_completo t | sabia-verde | pontuacao 0
 pedagogico.turma_aluno: id 31 | turma_id 10 | aluno_id 10 | "Teste Primeiro Acesso"
```

**2. Código inválido**: nenhum usuário criado (`usuarios = 10` antes e depois).
```
codigoTurma ZZZZZZ → 404 {"status":404,"erro":"Código de turma inválido. Verifique com seu professor.",…}
codigoTurma SAB-A! → 404 (mesma mensagem)
```

**3. Pedagogico parado** (`docker compose stop pedagogico-service`)
```
→ 503 {"status":503,"erro":"Não foi possível concluir agora. Tente novamente.",…}   (~3 s)
usuarios=10 alunos=7 antes e depois → nenhum usuário criado
log: WARN … Serviço Pedagógico indisponível no primeiro acesso: ResourceAccessException
```
- Religado o serviço, uma tentativa **0,4 s depois do "Started"** ainda deu 503 (nada gravado).
- Diagnóstico: o nome `pedagogico-service` não resolvia com o container parado, e a JVM guarda resultados negativos de DNS por ~10 s. A tentativa seguinte (01:14:33) deu **201**: aluno id 11, `turma_aluno` 32. Ver §7.

**4. Duplicidade**
```
e-mail repetido                         → 409 {"erro":"E-mail já cadastrado.","campos":{"email":"E-mail já cadastrado."}}
e-mail repetido com maiúsculas          → 409 campos.email
matrícula repetida (TESTE-C-001)        → 409 {"campos":{"matricula":"Matrícula já cadastrada."}}
matrícula do seed (20260001)            → 409 campos.matricula
extra: avatar "avatar-1.png"            → 400 {"campos":{"avatar":"Avatar inválido."}}
extra: senhas divergentes               → 422 "As senhas não coincidem."
extra: data 2099-01-01                  → 400 {"campos":{"dataNascimento":"A data de nascimento deve estar no passado."}}
```

**5. Endpoints internos**
| Requisição | Resultado |
|---|---|
| gateway `GET /api/pedagogico/api/interno/turmas/por-codigo/SABIA1` sem token | **404** (bloqueado no gateway) |
| idem com token de aluno | **404** |
| gateway `POST /api/pedagogico/api/interno/turmas/10/alunos` com token de aluno | **404** |
| gateway com `%69nterno`, `API/INTERNO`, `//api//interno` | **404** nos três |
| direto `:8081/api/interno/...` (GET e POST) com token de aluno | **403** |
| direto `:8081` com token SISTEMA: `/api/interno/...` / `/api/professor/turmas` / `/api/aluno/atividades` | **200 / 403 / 403** |
| auth `:8080` com token SISTEMA: `/api/auth/me` / `/api/auth/validate` | **403** / `{"valido":false,…}` |
| gateway com token SISTEMA: `/api/pedagogico/api/interno/...` / `/api/pedagogico/api/professor/turmas` | **404 / 403** |
| regressão: `/api/pedagogico/api/aluno/atividades` (aluno) / `professor/turmas` sem token / com token de aluno / `/api/publico/convites/SABIA1` | 200 / 401 / 403 / 200 |

**OpenAPI:** `/api/auth/primeiro-acesso` (POST) aparece no auth-service. `/api/interno/turmas/por-codigo/{codigo}` e `/api/interno/turmas/{turmaId}/alunos` aparecem no pedagogico.

**6. Limpeza** (transação única, com guardas por id e e-mail de teste)
```
pedagogico.turma_aluno removidos: 31 (aluno 10), 32 (aluno 11)
auth.aluno removidos:             10 (TESTE-C-001), 11 (TESTE-C-003)
auth.usuario removidos:           10 (teste.primeiroacesso@sabia.edu), 11 (teste.indisponivel@sabia.edu)
auth.token_recuperacao_senha:     nenhum vinculado
Depois: usuarios=9 (max 9), turma_aluno=1 (max 30)
```
As sequences ficaram em `usuario_id_seq = 11` e `turma_aluno_id_seq = 32`. Elas não recuam, então os ids 10 e 11 e os 31 e 32 não serão reutilizados (comportamento esperado da issue A). Uma última tentativa de log com código inexistente (§6) não gravou nada.

## 6. Dados pessoais em log

- O código desta issue loga **só ids** (`aluno id`, `turma id`) e o nome da classe da falha do pedagogico. A mensagem do `RestClient`, que inclui a URL com o código, não é logada.
- Na validação em execução foi encontrado um vazamento. O perfil `dev` tem `org.springframework.web: DEBUG`, e o `RequestResponseBodyMethodProcessor` imprime o `toString()` do corpo lido. No `PrimeiroAcessoRequest` (record), isso expunha nome, matrícula, data e e-mail.
- **Corrigido** com um `toString()` que devolve `PrimeiroAcessoRequest[dados omitidos]`. Depois do redeploy, 0 ocorrências nos logs de auth, pedagogico e gateway.

## 7. Riscos e pendências

- **⚠ Endpoint público de criação de contas sem rate limiting até a issue G.** Ele permite criação em massa de contas e enumeração de códigos de turma e de e-mails/matrículas cadastrados (via 409). A issue G **deve ir antes de qualquer deploy exposto**, cobrindo pelo menos `/api/auth/primeiro-acesso` e `/api/publico/**`.
- **⚠ Preexistente (não corrigido, conforme a regra):** com o perfil `dev`, o mesmo DEBUG do Spring MVC loga o `LoginRequest` com **e-mail e senha em texto puro** (`LoginRequest[email=…, senha=…]`). Recomendação: sobrescrever o `toString()` do `LoginRequest` (e de `TrocarSenhaRequest`/`RedefinirSenhaRequest`) e/ou baixar `org.springframework.web` para INFO.
- **SQL manual do CPF** para ambientes sem `data.sql`: `ALTER TABLE auth.usuario ALTER COLUMN cpf DROP NOT NULL;` (§4).
- **Cache negativo de DNS da JVM:** logo depois de o pedagogico voltar, o auth-service pode responder 503 por ~10 s. É inofensivo (nada é gravado e o usuário só precisa tentar de novo), mas afeta testes manuais. Se incomodar, ajustar `networkaddress.cache.negative.ttl`.
- **Janela residual aceita:** um commit local que falhe depois da matrícula remota deixa um `turma_aluno` órfão. Isso é registrado em WARN com ids, e o id nunca é reutilizado. Uma limpeza periódica de órfãos pode ser avaliada depois.
- **Instituição do aluno novo nula:** o endpoint interno não devolve `instituicaoId`. Se algum fluxo depender de `usuario.instituicao_id` para alunos, basta acrescentar o campo à resposta interna.
- **`esqueci-senha` continua case-sensitive** (`RecuperacaoSenhaService` usa `findByEmail`). Fora do escopo pedido (login + unicidade). Como os e-mails novos são gravados em minúsculas, só afeta quem digitar o e-mail com maiúsculas no "esqueci minha senha".
- **Perfil DIRETOR não existe** no auth-service (só `ADMINISTRADOR`), e não há cadastro de professor/admin nesta branch. A guarda de CPF na entidade vale para qualquer fluxo futuro.
- **Rota legada do gateway** `POST /login` (`routes/auth.ts`): usa `auth.cpf` como `sub` e chama `${AUTH_URL}/login`, que não existe no auth-service. É preexistente, está quebrada e não é afetada; só registrada.
- **pedagogico-service sem testes automatizados:** os endpoints internos foram verificados só em execução (§5.2).
- **E-mails do seed:** todos em minúsculas; nenhum precisou de ajuste.

## 8. Descrição de PR

**Título:** `feat(primeiro-acesso): cadastro atômico do aluno pelo convite (HU003.2)`

```markdown
## Contexto
HU003.2: o aluno chega pelo link de convite **sem conta**. Um único POST cria usuário +
aluno, vincula à turma e devolve o JWT, sem deixar conta criada se o vínculo falhar.
Depende das issues A (sequences) e B (validação pública do código).

## O que muda
**auth-service**
- `POST /api/auth/primeiro-acesso` (público): codigoTurma, nomeCompleto, matricula,
  dataNascimento, avatar (catálogo fixo `sabia-*`), email, senha, confirmarSenha. Sem CPF.
- Respostas no padrão `{status, erro, timestamp, campos?}`:
  201 LoginResponse + `turma.nome` · 400 por campo · 404 código inválido (mesma mensagem da HU003.1)
  · 409 `campos.email` / `campos.matricula` · 422 senhas divergentes · 503 pedagogico indisponível.
- `PrimeiroAcessoService` (@Transactional): busca a turma → checa duplicidade → `saveAndFlush`
  usuário e aluno → matrícula remota → JWT. Falha na matrícula = rollback (nenhuma conta criada).
- `PedagogicoClient` (RestClient, timeouts de 2 s/5 s) com token de serviço `SISTEMA` (60 s), que
  nunca sai do backend, não autentica no auth-service e é `valido:false` no `/validate`.
- `Usuario.cpf` opcional **só para ALUNO**: professor/admin continuam exigindo CPF (guarda na entidade).
- Login e checagem de unicidade com e-mail normalizado e case-insensitive.

**pedagogico-service**
- `GET /api/interno/turmas/por-codigo/{codigo}` e `POST /api/interno/turmas/{turmaId}/alunos`,
  restritos a `ROLE_SISTEMA`. Reaproveitam a validação da HU003.1 e a matrícula existente
  (métodos extraídos, sem cópia).

**api-gateway**
- `/api/pedagogico/**/api/interno/**` → 404 antes da autenticação (defesa em profundidade).

**docker-compose**
- `PEDAGOGICO_URL` no auth-service (sem mudança de portas).

## Migração
Bancos que não rodam o `data.sql`:
    ALTER TABLE auth.usuario ALTER COLUMN cpf DROP NOT NULL;

## ⚠ Antes de expor
Sem rate limiting até a issue G: ela deve entrar antes de qualquer deploy exposto.

## Como testar
- `./mvnw test` no auth-service → 47 testes (16 novos em `PrimeiroAcessoControllerTest`).
- Via gateway: primeiro acesso com `SABIA1` → 201; login → 200; `/api/pedagogico/api/aluno/atividades` → 200.
- Pedagogico parado → 503 e nenhum usuário criado.
- `/api/pedagogico/api/interno/...` → 404 com ou sem token.

Evidências: `docs/resultado-primeiro-acesso-atomico.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
