# Diagnóstico — Serviço Pedagógico

> Diagnóstico factual do código-fonte atual (herdado da Fase 1 / TCC-1), levantado para
> subsidiar a divisão da "Tarefa 02: Serviço Pedagógico" em issues no GitHub. Este
> documento não contém recomendações de implementação nem propostas de subtarefas.

## 1. Estrutura geral do backend

- **Maven de módulo único.** `api/pom.xml` define um único artefato (`com.sabia:api`),
  sem `<modules>`. Não há multi-módulo Maven nem Gradle no repositório.
- **Empacotamento por camada técnica, não por domínio/bounded context.** Pacotes em
  `api/src/main/java/com/sabia/api/`: `config`, `controller` (subpacotes `aluno`, `auth`,
  `ia`, `professor`), `dto` (`request`/`response`), `exception`, `mapper`, `model`
  (subpacotes `atividade`, `instituicao`, `turma`, `usuario`), `repository`, `security`,
  `service`. **Não existe** nenhum pacote `pedagogico`, `gamificacao` ou equivalente —
  nenhuma separação por futuro microsserviço.
- **RabbitMQ / mensageria: não encontrado.**
  - Nenhuma dependência de mensageria em `api/pom.xml` (sem `spring-boot-starter-amqp`,
    `spring-rabbit` ou Kafka).
  - Busca por `rabbit|amqp|queue|exchange|@EnableRabbit|kafka` em todo `api/src` não
    retornou nenhuma ocorrência real.
  - Não há `RabbitTemplate`, `@RabbitListener`, filas ou exchanges declaradas em
    `api/src/main/resources/application.yml` ou `application-dev.yml`.
  - `docker-compose.yml` (raiz do repo) define apenas os serviços `db` (Postgres),
    `api` e `web` — **nenhum serviço RabbitMQ/broker**.
- **Dependências principais** (`api/pom.xml`, Spring Boot parent `4.0.7`, Java 21):
  `spring-boot-starter-data-jpa`, `spring-boot-starter-security`,
  `spring-boot-starter-validation`, `spring-boot-starter-web`, `spring-boot-devtools`
  (runtime/optional), `org.postgresql:postgresql` (runtime),
  `io.jsonwebtoken:jjwt-api/impl/jackson` (`0.12.6`), `lombok`,
  `org.mapstruct:mapstruct` (`1.6.3`), `springdoc-openapi-starter-webmvc-ui` (`3.0.1`);
  em teste: `spring-boot-starter-test`, `spring-security-test`.
- **Configuração relevante em `application.yml`:** persistência (`ddl-auto: update`,
  `show-sql: true`), JWT (`sabia.jwt.*`), CORS (`sabia.cors.allowed-origins`) e
  integração direta com IA (`sabia.ia.gemini.api-key`, `sabia.ia.gemini.model:
  gemini-2.5-flash`) — não há nenhuma seção de mensageria.
- **Versionamento de schema: não encontrado.** Busca por `flyway|liquibase` em todo
  `api/` não retornou nada. O schema é gerenciado apenas via Hibernate `ddl-auto`
  (`update` em dev). `docs/architecture.md` menciona "migrations via Flyway
  recomendado" para produção, mas nenhuma dependência ou configuração de Flyway/Liquibase
  existe hoje no projeto.
- **Divergência de documentação:** `docs/architecture.md` e `docs/setup.md` descrevem a
  estrutura de pacotes como `com.sabia.api/domain/model/` e os diretórios do monorepo
  como `apps/web`/`apps/api`. A estrutura real do repositório é `web/` e `api/` na raiz
  (confirmado por `README.md` e pela árvore de diretórios), e o pacote de entidades é
  `com.sabia.api.model` (sem `domain`). Essa documentação está desatualizada em relação
  ao código atual.

## 2. Entidades de domínio

Todas em `api/src/main/java/com/sabia/api/model/`:

- **`Turma`** (`model/turma/Turma.java`) — `@Entity @Table(name="turma")`. Campos: `id`
  (IDENTITY), `nome`, `professor` (`@ManyToOne` lazy, not-null → `Professor`),
  `instituicao` (`@ManyToOne` lazy, opcional → `Instituicao`), `etapa`
  (`@Enumerated(STRING)` → `EtapaEnsino`), `criadaEm` (setado em `@PrePersist`).

- **Matrícula — `TurmaAluno`** (`model/turma/TurmaAluno.java`), equivalente a
  "Aluno_Turma". `@Entity @Table(name="turma_aluno", uniqueConstraints=(turma_id,
  aluno_id))`. Campos: `id`, `turma` (`@ManyToOne` → `Turma`), `aluno` (`@ManyToOne` →
  `Aluno`), `ingressoEm`.

- **`AtividadeAvaliativa`** (`model/atividade/AtividadeAvaliativa.java`) — `@Entity
  @Table(name="atividade_avaliativa")`. Campos: `id`, `turma` (`@ManyToOne` lazy,
  not-null), `titulo`, `descricao` (TEXT), `dataEntrega`, `pontuacaoMaxima` (int),
  `eGeradaIa` (boolean, default false), `status` (`@Enumerated(STRING)` →
  `StatusAtividade` com valores `RASCUNHO`/`PUBLICADA`), `gabaritoEstadoJson` (TEXT,
  nullable), `criadaEm`.

- **`AtividadeDaTrilha` / atividade de conhecimento: não encontrado.** Não existe
  nenhuma classe, arquivo ou referência a "trilha" no backend. O único tipo de
  atividade persistido é `AtividadeAvaliativa`.

- **`Submissao`** (`model/atividade/Submissao.java`) — classe **abstrata**, `@Entity
  @Inheritance(strategy=TABLE_PER_CLASS)`. Campos: `id` (AUTO), `aluno` (`@ManyToOne`
  → `Aluno`, not-null), `dataEnvio`, `status` (`@Enumerated(STRING)` →
  `StatusSubmissao`, valores `PENDENTE`/`EM_CORRECAO`/`CORRIGIDA`).
  - Subclasse concreta **`SubmissaoAvaliativa`**
    (`model/atividade/SubmissaoAvaliativa.java`) — `@Table(name="submissao_avaliativa",
    unique=(aluno_id, atividade_id))`. Adiciona `projeto` (`@OneToOne` cascade ALL,
    not-null, unique → `ProjetoAvaliativo`), `atividade` (`@ManyToOne` →
    `AtividadeAvaliativa`), `correcao` (`@OneToOne(mappedBy="submissao")` cascade ALL →
    `Correcao`).

- **`Correcao`** (`model/atividade/Correcao.java`) — `@Entity
  @Table(name="correcao")`. Campos: `id`, `submissao` (`@OneToOne` lazy, not-null,
  unique → `Submissao`), `nota` (`BigDecimal`, precision 5/scale 2),
  `feedbackProfessor` (TEXT), `relatorioIaJson` (TEXT — coluna existe, mas nenhum
  código no repositório popula ou lê esse campo, ver seção 4), `avaliadaEm`.

- **Outras entidades correlatas encontradas** em `model/atividade`:
  - **`ProjetoScratch`** (abstrata, `@Inheritance TABLE_PER_CLASS`): `id`, `aluno`
    (`@ManyToOne` → `Aluno`), `estadoJson` (TEXT — estado do projeto Blockly/Scratch do
    aluno), `criadoEm`.
    - Subclasse concreta **`ProjetoAvaliativo`**
      (`model/atividade/ProjetoAvaliativo.java`), sem campos próprios além dos
      herdados. Esta é a entidade mais próxima de um domínio "Sandbox" hoje existente,
      mas está embutida no pacote `atividade`, acoplada 1:1 a `SubmissaoAvaliativa`, e
      não separada como domínio próprio.
  - Enums: `StatusAtividade`, `StatusAtividadeAluno` (`PENDENTE, EM_ANDAMENTO,
    ENTREGUE, CORRIGIDA`), `StatusSubmissao`. `StatusAtividadeAluno` **não é um campo
    persistido** — é calculado em `AtividadeAvaliativaService.toAlunoResponse()`
    (`api/src/main/java/com/sabia/api/service/AtividadeAvaliativaService.java`, linhas
    157-165): `PENDENTE` se não há submissão, `CORRIGIDA` se a submissão está
    `CORRIGIDA`, `ENTREGUE` caso contrário. O valor `EM_ANDAMENTO` do enum nunca é
    atribuído nessa lógica — não há estado de rascunho/em-andamento no backend hoje.

- **Entidades de outros domínios, hoje no mesmo módulo/pacote raiz**
  (`model/usuario`, `model/instituicao`):
  - `Usuario` (`model/usuario/Usuario.java`) — implementa `UserDetails` (Spring
    Security). Campos: `id`, `instituicao` (`@ManyToOne`), `nome`, `cpf` (unique),
    `dataNascimento`, `email` (unique), `senhaHash`, `tipoPerfil` (enum
    `PerfilUsuario`: `ADMINISTRADOR, PROFESSOR, ALUNO`), `criadoEm`.
  - `Aluno` (`model/usuario/Aluno.java`) — `@OneToOne @MapsId` para `Usuario`, campo
    próprio `pontuacaoGeral` (int) — **dado de gamificação/XP acoplado diretamente à
    entidade de usuário**, sem serviço de gamificação separado hoje.
  - `Professor` (`model/usuario/Professor.java`) — `@OneToOne @MapsId` para `Usuario`,
    campo `especialidade`.
  - `Instituicao` (`model/instituicao/Instituicao.java`) — `id`, `nome`, `cnpj`
    (unique), `criadaEm`.
  - Estas quatro entidades pertencem conceitualmente ao futuro Serviço de Autenticação,
    mas hoje são referenciadas diretamente via `@ManyToOne`/`@OneToOne` por `Turma`,
    `AtividadeAvaliativa` (indiretamente via `Turma`), `Submissao`/`SubmissaoAvaliativa`
    e `ProjetoScratch` — acoplamento por chave estrangeira JPA entre o que seria
    "Serviço Pedagógico" e "Serviço de Autenticação"/"Serviço de Gamificação".

## 3. Endpoints REST existentes

**CRUD de turmas** — `ProfessorTurmaController`
(`api/src/main/java/com/sabia/api/controller/professor/ProfessorTurmaController.java`,
`@RequestMapping("/api/professor/turmas")`):
- `GET /api/professor/turmas` → `listar()` → `List<TurmaResponse>` (via
  `TurmaService.listarDoProfessor`). `TurmaResponse` = `record(Long id, String nome)`.
- **Apenas listagem.** Não há endpoint de criar, editar ou deletar turma em nenhum
  controller do projeto.

**Atividades avaliativas — professor** — `ProfessorAtividadeController`
(`controller/professor/ProfessorAtividadeController.java`,
`@RequestMapping("/api/professor/atividades")`):
- `GET /api/professor/atividades?turmaId=&status=` → `listar()` →
  `List<AtividadeAvaliativaProfessorResponse>`
- `POST /api/professor/atividades` → `criar()`, body
  `CriarAtividadeAvaliativaRequest` (`titulo`, `descricao`, `status`, `turmaId`,
  `pontuacaoMaxima`, `dataEntrega`, `gabaritoEstadoJson`) →
  `AtividadeAvaliativaProfessorResponse` (201)
- `GET /api/professor/atividades/{id}` → `buscar()` →
  `AtividadeAvaliativaProfessorResponse`
- `PUT /api/professor/atividades/{id}` → `editar()`, body `EditarAtividadeRequest`
  (`titulo`, `descricao`, `pontuacaoMaxima`, `dataEntrega`, `gabaritoEstadoJson`) →
  `AtividadeAvaliativaProfessorResponse`
- `DELETE /api/professor/atividades/{id}` → `deletar()` → 204
- `PATCH /api/professor/atividades/{id}/publicar` → `publicar()` →
  `AtividadeAvaliativaProfessorResponse`
- `PATCH /api/professor/atividades/{id}/despublicar` → `despublicar()` →
  `AtividadeAvaliativaProfessorResponse`
- `GET /api/professor/atividades/{id}/submissoes?status=&page=&size=&sort=` →
  `listarSubmissoesDaAtividade()` → `PageResponse<SubmissaoListagemResponse>`

**Atividades avaliativas — aluno** — `AlunoAtividadeController`
(`controller/aluno/AlunoAtividadeController.java`,
`@RequestMapping("/api/aluno/atividades")`):
- `GET /api/aluno/atividades` → `listar()` → `List<AtividadeAvaliativaAlunoResponse>`
  (apenas publicadas, das turmas do aluno)
- `GET /api/aluno/atividades/{id}` → `buscar()` → `AtividadeAvaliativaAlunoResponse`
- `POST /api/aluno/atividades/{id}/submeter` → `submeter()`, body
  `SubmeterAtividadeRequest` (`estadoJson`) → `SubmissaoAvaliativaResponse` (201)

**Atividades da trilha/conhecimento: não encontrado.** Nenhum controller, service ou
entidade trata "atividade da trilha".

**Submissão pelo aluno** — coberta acima (`POST .../submeter`) e por
`AlunoSubmissaoController` (`controller/aluno/AlunoSubmissaoController.java`,
`@RequestMapping("/api/aluno/submissoes")`):
- `GET /api/aluno/submissoes` → `listar()` → `List<SubmissaoAvaliativaResponse>`
- `GET /api/aluno/submissoes/{id}` → `buscar()` → `SubmissaoAvaliativaResponse`

**Correção pelo professor** — `ProfessorSubmissaoController`
(`controller/professor/ProfessorSubmissaoController.java`,
`@RequestMapping("/api/professor/submissoes")`):
- `GET /api/professor/submissoes/{id}` → `buscar()` → `SubmissaoAvaliativaResponse`
- `POST /api/professor/submissoes/{id}/corrigir` → `corrigir()`, body
  `AvaliarSubmissaoRequest` (`nota`, `feedbackProfessor`) →
  `SubmissaoAvaliativaResponse`. Correção é 100% manual pelo professor — confirmado em
  `SubmissaoAvaliativaService.corrigir`, sem qualquer chamada a IA nesse fluxo.

**Rascunho/auto-save: não encontrado.** Não existe endpoint do tipo `PUT
/api/aluno/atividades/{id}/rascunho` (ou similar) em nenhum controller.

**Outros endpoints** (fora do escopo pedagógico, listados para completude):
- `GET /api/health` — `HealthController` (`controller/HealthController.java`).
- `POST /api/auth/login` — `AuthController` (`controller/auth/AuthController.java`),
  body `LoginRequest` (`email`, `senha`) → `LoginResponse` (`token`, `tipo`, `perfil`,
  `nome`).
- `POST /api/ia/gerar-atividade` — `IaController`
  (`controller/ia/IaController.java`), body `GerarAtividadeRequest` (`idTurma`,
  `tipoAtividade`, `descricaoObjetivo`) → `SugestaoAtividadeResponse` (`titulo`,
  `descricao`, `gabaritoEstadoJson`).

**Testes automatizados:** único arquivo em `api/src/test/`:
`api/src/test/java/com/sabia/api/SabiaApplicationTests.java` — apenas um teste de
contexto Spring (`contextLoads()`), sem asserções de negócio. **Nenhum dos endpoints
listados acima possui teste automatizado** (nenhum `@WebMvcTest`, `@SpringBootTest`
com `MockMvc`, ou teste de controller/service encontrado no repositório).

## 4. Integração com RabbitMQ / IA

- **Publicação de evento de correção em fila: não encontrado.** A correção
  (`ProfessorSubmissaoController.corrigir` → `SubmissaoAvaliativaService.corrigir`) é
  gravada diretamente no banco (`correcaoRepository.save`), sem publicar nada em fila
  e sem envolver IA.
- **Consumidor de resposta da IA: não encontrado.** Não há `@RabbitListener` nem
  qualquer mecanismo assíncrono no projeto.
- **Chamada à IA hoje é síncrona, via HTTP direto**, e usada apenas para *geração* de
  atividade (não para correção): `IaAtividadeService.gerarSugestao()`
  (`api/src/main/java/com/sabia/api/service/IaAtividadeService.java`) usa `RestClient`
  injetado para chamar diretamente
  `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
  (API do Gemini, configurada em `sabia.ia.gemini.*` em `application.yml`), bloqueando
  a thread da requisição HTTP do controller enquanto aguarda a resposta.
- **Payload usado hoje:**
  - Requisição ao Gemini: `{"contents":[{"parts":[{"text": <prompt>}]}],
    "generationConfig":{"temperature":0.7,"responseMimeType":"application/json"}}`.
  - Resposta esperada da IA (parseada do texto gerado): `{"titulo": "...",
    "descricao": "...", "gabarito_estado_json": {"blocks": {"languageVersion": 0,
    "blocks": [...]}}}`.
  - Resposta do endpoint `/api/ia/gerar-atividade` ao frontend:
    `SugestaoAtividadeResponse(titulo, descricao, gabaritoEstadoJson)`.
- Existe a coluna `relatorioIaJson` na entidade `Correcao`, mas **nenhum código no
  repositório popula ou lê esse campo** — não há geração de relatório de IA para
  correção hoje, apenas a coluna de schema já reservada.
- Não existe nenhum producer/consumer RabbitMQ em nenhum ponto do fluxo de IA ou de
  correção (confirma o achado da seção 1).

## 5. Frontend consumidor

Todos os services usam a mesma instância Axios base (`web/src/lib/api.ts`), com
`baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"` e injeção de
`Authorization: Bearer <token>` a partir do `localStorage`. **Nenhum service usa dados
mockados/hardcoded** — todas as chamadas abaixo são reais via Axios.

| Service | Hook(s) | Endpoint(s) chamado(s) | Status |
|---|---|---|---|
| `web/src/services/turmas.ts` | `web/src/hooks/useTurmas.ts` | `GET /api/professor/turmas` | Totalmente funcional (só listagem, sem create/update/delete) |
| `web/src/services/atividades.ts` | `web/src/hooks/useAtividades.ts`, `useAtividadeDetalhes.ts` | `GET /api/professor/atividades`, `GET /api/professor/atividades/{id}`, `POST /api/professor/atividades`, `PUT /api/professor/atividades/{id}`, `PATCH .../publicar`, `PATCH .../despublicar`, `DELETE /api/professor/atividades/{id}` | Totalmente funcional (CRUD completo do lado professor) |
| `web/src/services/atividadesAlunoService.ts` | `web/src/hooks/useAtividadesAluno.ts` | `GET /api/aluno/atividades`, `GET /api/aluno/atividades/{id}`, `POST /api/aluno/atividades/{id}/submeter` | Totalmente funcional (listar, detalhe, submeter) |
| `web/src/services/submissoes.ts` | `web/src/hooks/useSubmissoes.ts` | `GET /api/professor/atividades/{atividadeId}/submissoes?page=` | Totalmente funcional (só leitura) |
| `web/src/services/ia.ts` | `web/src/hooks/useGerarAtividadeIa.ts` | `POST /api/ia/gerar-atividade` | Totalmente funcional (chamada síncrona direta à API, não via fila) |

- **Rascunho/auto-save: não encontrado** no frontend — nenhum hook/service chama um
  endpoint desse tipo.
- **Correção: não há service/hook de correção no frontend.** O componente
  `web/src/components/professor/atividades/detalhes/SubmissoesTable.tsx` (linhas 161 e
  165) contém um link para a rota `/professor/submissoes/{id}/corrigir`, mas **essa
  página não existe** em `web/src/app/` — é um link morto / funcionalidade de
  correção não implementada no frontend, apesar do endpoint de backend
  (`POST /api/professor/submissoes/{id}/corrigir`) existir.
- **Tipos** (`web/src/types/index.ts`, `web/src/types/atividade.ts`): `Turma`,
  `AtividadeAvaliativa`, `AtividadeDetalhes`, `SubmissaoItem`, `AtividadeAlunoDTO`,
  `PageResponse<T>`, `ApiResponse<T>` — todos são DTOs com formato próprio do
  frontend (campos simples), sem anotações JPA nem relacionamentos aninhados — não há
  indício de vazamento direto de entidade JPA para o frontend.

**Páginas e o que consomem:**
- `web/src/app/aluno/atividades/page.tsx` → `useAtividadesAluno`
- `web/src/app/aluno/atividades/[id]/page.tsx` → `useAtividadeAluno`
- `web/src/app/aluno/atividades/[id]/editor/page.tsx` → `useAtividadeAluno` +
  `submeterAtividade` (chamada direta ao service, sem hook de mutation)
- `web/src/app/professor/atividades/page.tsx` → `useAtividades` + `useTurmas`
- `web/src/app/professor/atividades/nova/page.tsx` → `AtividadeFormModal.tsx` (usa
  `useCriarAtividade`, `useAtualizarAtividade`, `usePublicarAtividade`, `useTurmas`,
  `useGerarAtividadeIa`)
- `web/src/app/professor/atividades/[id]/page.tsx` → `useAtividadeDetalhes` +
  `useSubmissoes`
- `web/src/app/professor/atividades/[id]/editar/page.tsx` → `useAtividade` (de
  `useAtividades.ts`) + `AtividadeFormModal.tsx`

**Telas dependentes do futuro Serviço Pedagógico:** todas as páginas listadas acima
(`aluno/atividades/**`, `professor/atividades/**`) dependem de dados de Turmas,
Atividades Avaliativas e Submissões que hoje vêm do backend monolítico e migrariam
para o Serviço Pedagógico. **Não foi encontrada nenhuma tela** dedicada a "Atividade
da Trilha/Conhecimento" — o tipo `TipoAtividade` no frontend inclui o valor
`'ATIVIDADE_TRILHA'` e o formulário (`AtividadeFormModal.tsx`) e o painel de IA
(`GerarAtividadeIaPanel.tsx`) aceitam esse valor como parâmetro, mas não há
rota/página de listagem específica para atividades da trilha — apenas o formulário
genérico é parametrizável por tipo, sem contrapartida no backend (ver seção 2/3).

## 6. Lacunas identificadas

Lacunas observadas diretamente no código, entre o que existe hoje e o que a
arquitetura de microsserviços da Fase 2 exige para o Serviço Pedagógico:

- **Nenhuma publicação real em fila.** A arquitetura alvo prevê que o Serviço
  Pedagógico publique eventos de correção no RabbitMQ para o Serviço de IA/Worker;
  hoje não existe nenhuma dependência, configuração ou código de mensageria no
  projeto (seções 1 e 4).
- **Correção hoje é 100% manual e síncrona** (professor lança nota/feedback
  diretamente via `POST /api/professor/submissoes/{id}/corrigir`); não há qualquer
  fluxo de correção assistida por IA implementado, apenas uma coluna de schema
  (`Correcao.relatorioIaJson`) reservada e não usada.
- **Geração de atividade por IA é síncrona e bloqueante** (`RestClient` chamando a
  API do Gemini diretamente dentro da thread da requisição HTTP), e não passa por
  nenhum broker/worker.
- **Nenhuma separação por bounded context no código-fonte.** O pacote é organizado
  por camada técnica (`controller`, `model`, `service`, etc.), não por domínio —
  entidades de Turma/Atividade/Submissão/Correção convivem no mesmo módulo Maven e
  nos mesmos pacotes-pai que entidades de Usuário/Autenticação e Instituição.
- **Acoplamento por FK JPA entre domínios futuros distintos.** `Turma`,
  `AtividadeAvaliativa`, `Submissao`/`SubmissaoAvaliativa` e `ProjetoScratch`
  referenciam diretamente (`@ManyToOne`/`@OneToOne`) `Usuario`/`Aluno`/`Professor`
  (futuro Serviço de Autenticação) e `Instituicao`. O campo `Aluno.pontuacaoGeral`
  (XP/gamificação) está embutido na entidade de usuário, sem separação do futuro
  Serviço de Gamificação.
- **Conceito "Sandbox" (projetos livres) está embutido no domínio de atividade.**
  `ProjetoScratch`/`ProjetoAvaliativo` vive no pacote `model/atividade` e é acoplado
  1:1, via cascade, a `SubmissaoAvaliativa` — não há separação estrutural do que a
  arquitetura alvo define como Serviço de Sandbox.
- **`AtividadeDaTrilha` (atividade de conhecimento) não existe no backend.** Apenas
  `AtividadeAvaliativa` está implementada; o valor `'ATIVIDADE_TRILHA'` existe somente
  como opção em um enum de tipo no frontend, sem entidade, endpoint ou persistência
  correspondente.
- **CRUD de turmas incompleto.** Existe apenas `GET /api/professor/turmas`
  (listagem); não há endpoints de criação, edição ou exclusão de turma em nenhum
  controller, apesar da entidade `Turma` e do relacionamento `TurmaAluno` já
  existirem.
- **Sem rascunho/auto-save.** Não existe endpoint nem tela para o aluno salvar
  progresso parcial de uma atividade antes de submeter; o enum
  `StatusAtividadeAluno.EM_ANDAMENTO` existe mas nunca é atribuído em código.
- **Sem versionamento de schema.** O schema é gerenciado apenas por
  `hibernate.ddl-auto` (não há Flyway/Liquibase), o que tende a ser um problema ao
  dividir o banco entre múltiplos serviços/bancos na Fase 2.
- **Ausência de testes automatizados** para qualquer endpoint pedagógico — o único
  teste do projeto é um `contextLoads()` sem asserções
  (`api/src/test/java/com/sabia/api/SabiaApplicationTests.java`), o que aumenta o
  risco de regressão ao extrair/migrar este domínio para um serviço separado.
- **Funcionalidade de correção incompleta no frontend.** O backend já expõe
  `POST /api/professor/submissoes/{id}/corrigir`, mas o frontend não tem
  service/hook para essa chamada, e há um link para uma página de correção
  (`/professor/submissoes/{id}/corrigir`) que não existe em `web/src/app/`.
- **Documentação de arquitetura desatualizada.** `docs/architecture.md` e
  `docs/setup.md` descrevem uma estrutura de diretórios (`apps/web`, `apps/api`,
  `domain/model`) que não corresponde à estrutura real do repositório (`web/`, `api/`
  na raiz, pacote `model` sem `domain`), o que pode induzir a erro no planejamento da
  extração de serviços se usada como referência sem verificação.

## 7. Perguntas em aberto

- A entidade `ProjetoScratch`/`ProjetoAvaliativo` (estado Blockly/Scratch) deve ser
  tratada como parte do Serviço Pedagógico (por estar hoje acoplada 1:1 a
  `SubmissaoAvaliativa`) ou do futuro Serviço de Sandbox? O código atual não permite
  concluir isso sozinho, pois a entidade está fisicamente no pacote `atividade`, mas
  conceitualmente pode se sobrepor ao domínio de Sandbox descrito na arquitetura alvo.
- O campo `Aluno.pontuacaoGeral` (XP) é atualizado por algum fluxo relacionado a
  atividades/correção? Não foi encontrado nenhum código, no backend investigado, que
  escreva nesse campo a partir de submissão/correção — não foi possível confirmar se
  essa integração existe em outro ponto não coberto por este diagnóstico ou se está
  simplesmente ainda não implementada.
- Existe alguma definição já feita (fora deste repositório) de qual serviço deve
  possuir o conceito "Atividade da Trilha", já que ele não existe hoje nem no backend
  nem em nenhuma tela dedicada do frontend — apenas como valor de enum solto no
  formulário de criação de atividade?
- O link morto para `/professor/submissoes/{id}/corrigir` no frontend indica uma
  tela planejada e não implementada, ou um resquício de código que deveria ser
  removido? Isso pode mudar se a subtarefa correspondente é "criar do zero" ou
  "retomar trabalho abandonado".
- `docs/architecture.md` recomenda Flyway para produção mas ele não está presente no
  projeto — essa é uma decisão ainda pendente de execução, ou o plano mudou e o
  documento está apenas desatualizado?
