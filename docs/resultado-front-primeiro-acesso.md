# Resultado — Front do primeiro acesso do aluno (issues D1 e D2 / HU003.3 e HU003.4)

Home com escolha de perfil, entrada por código da turma e rota `/convite/[codigo]`, chamando o backend das issues A, B e C pelo gateway. Data: 2026-10-14.

> **⚠ Validação de ponta a ponta NÃO executada.**
> - Durante a preparação do E2E (pull da imagem do Playwright), o **Docker Desktop travou**: VM `docker-desktop` do WSL em *Stopped*, daemon respondendo "Docker Desktop is unable to start" por mais de 8 min.
> - Por decisão do responsável, a entrega segue **sem E2E e sem capturas de tela**. Estão validados lint, type-check e build de produção (§5).
> - O roteiro E2E completo já está escrito e pronto para rodar quando o Docker voltar (§5.3).

## 1. Skills

- `ux-ui-design`: usada. As referências consultadas foram:
  - **UX Writing** (Podmajersky): erro = o que aconteceu + o que fazer; botões com verbo; frases curtas.
  - **Leis de psicologia** (Fitts, Hick, Postel, pico-final).
  - **Padrões de interface** (Tidwell): wizard com indicador de progresso, *forgiving format*, mensagens de erro inline.
- `frontend-design`: **não está disponível nesta sessão**. Segui os princípios da tarefa e o visual existente da home.

## 2. Arquivos

### Criados
| Arquivo | Papel |
|---|---|
| `src/app/convite/[codigo]/page.tsx` | Server Component (`params` como Promise). Metadata estática ("Convite para a turma — Sabiá", `robots: { index: false }`). Renderiza o mesmo hero com `EntradaAluno codigoInicial`. |
| `src/components/home/HomeShell.tsx` | Fundo, decoração, marca, h1, subtítulo e arte de blocos, extraídos da home **sem mudar o visual**. A área de ação é `children`. |
| `src/components/aluno/primeiro-acesso/EntradaAluno.tsx` | Ilha client: estados, transições, foco, anúncios e mapeamento de erros. |
| `…/PainelCodigo.tsx` | Painel "Qual é o código da sua turma?" |
| `…/FormularioDados.tsx` | Passos 1 e 2 (os dois ficam montados; só o visível aparece) |
| `…/SeletorAvatar.tsx` | Radiogroup de 8 avatares com radios nativos |
| `…/AvatarSabia.tsx` | Avatar: imagem final, se houver, senão o sabiá provisório em SVG |
| `…/CampoFormulario.tsx` | Label visível + dica + erro com `aria-invalid`/`aria-describedby` |
| `…/CampoSenha.tsx` | Senha com mostrar/ocultar (usado em Senha e Confirmar senha) |
| `…/TelaBoasVindas.tsx` | Tela de sucesso |
| `…/estilos.ts` | Classes dos botões/campos na paleta da home |
| `src/lib/avatares.ts` | Catálogo dos 8 ids, rótulos acessíveis, cores e **ponto único de troca** das imagens |
| `src/lib/schemas/primeiroAcessoSchema.ts` | Schema zod + campos por passo + limites de data |
| `src/lib/erroRequisicao.ts` | `ErroRequisicao` (status + `campos`, construído sobre `ErroApi`); status 0 = rede |
| `src/lib/fontesHome.ts` | Fredoka/Nunito, antes instanciadas na página, agora compartilhadas |
| `src/services/convites.ts` | `validarConvite`, `normalizarCodigo`, mensagem padrão do 404 |
| `src/hooks/useValidarConvite.ts`, `src/hooks/usePrimeiroAcesso.ts` | Mutations (react-query) |

### Alterados
| Arquivo | Mudança |
|---|---|
| `src/app/page.tsx` | Passa a ser `<HomeShell><EntradaAluno /></HomeShell>`. O conteúdo do hero foi movido sem alteração. |
| `src/services/auth.ts` | `primeiroAcesso()` + tipos `PrimeiroAcessoRequest/Response`. `login()` não mudou. |
| `src/styles/home.module.css` | Regras de painel aberto via `:has([data-painel-aberto])`, animações `pop`/`brilho` da boas-vindas e inclusão delas no bloco `prefers-reduced-motion`. Classes-gancho novas (`titulo`, `subtitulo`, `conteudo`, `acao`) não têm regra fora do painel aberto, então "/" fica visualmente igual. |

**Não alterados** (confirmado por `git diff`): `LoginForm`, telas de `(auth)`, `middleware.ts`, `components/ui/*`, `globals.css`, `app/layout.tsx`, backend, docker-compose. Nenhuma dependência nova.

## 3. Decisões visuais e de UX

- **Escolha de perfil (Lei de Hick):** só duas opções.
  - "Sou aluno" reaproveita exatamente o botão amarelo 3D do antigo "Bora começar!" (≥ 56 px, `pulse` só no estado inicial).
  - "Sou professor ou diretor" é um `<Link>` de contorno para `/login` (≥ 48 px).
  - Ficam lado a lado no desktop e empilhados no celular. Com o painel aberto, os dois encolhem para uma linha compacta e saem da tela quando o aluno chega aos dados.
- **Divulgação progressiva:** é tudo na mesma página. Código → dados (passo 1 "Conte sobre você", passo 2 "Crie seu acesso") → boas-vindas, com indicador "Passo N de 2" em texto e barra.
- **Painel com cara de peça:** card branco com borda e sombra "tinta" (`#1e2546`), no mesmo idioma dos blocos e do botão 3D. Lúdico sem infantilizar: tipografia Fredoka nos títulos e botões, Nunito no texto.
- **Hero com o painel aberto:** só CSS, sem estado no servidor, e a home segue estática.
  - A arte de blocos sai do fluxo (no celular, `display: none`; a partir de 768 px, absoluta e esmaecida).
  - O título encolhe e, no celular e em telas baixas, o subtítulo some, para o formulário caber acima da dobra.
  - `main` mantém `overflow-hidden`, então não há rolagem horizontal; a vertical continua livre.
- **Postel (formato tolerante):** o campo do código aceita minúsculas, espaços e hífen, convertendo para `A-Z0-9` em maiúsculas.
  - Ao colar, o texto inteiro é normalizado **antes** de cortar em 6, porque com `maxLength` o `" SABIA1 "` colado viraria `" SABIA"`.
  - O e-mail vai em minúsculas.
- **Prevenção de erros:** a validação é local por passo, antes de avançar (`mode: 'onTouched'`, revalidação ao digitar).
  - Código com menos de 6 caracteres recebe ajuda local, sem chamar a API.
  - A data tem `max` = hoje e `min` = 120 anos atrás.
  - Os campos de e-mail e senha não têm autocorreção nem capitalização automática.
- **Mensagens (o que aconteceu + o que fazer):** por exemplo, "As senhas não são iguais. Digite a mesma senha nos dois campos." e "Confira o e-mail. Ele precisa ser assim: nome@email.com". A mensagem do código inválido é exatamente a do backend.
- **Pico-final:** a boas-vindas é curta e festiva. Mostra o avatar escolhido em 112 px com um "pop" e três estrelinhas (sem confete pesado), o nome e a turma, e um único próximo passo: "Ir para minhas atividades".
- **Avatar:** grade 4×2 com alvos ≥ 48 px. O selecionado tem borda grossa, sombra e selo de check, ou seja, não depende só de cor.
- **Contraste AA sobre branco:** tinta 15:1; texto de apoio `#3a4266` ≈ 10:1; erro `#b3261e` 6,5:1; link `#2f55c0` ≈ 6,5:1.

## 4. Estados e transições

```
            ┌──────────── "Sou aluno" (aria-expanded) ────────────┐
 [inicial] ─┤                                                      ▼
            └─ "Sou professor ou diretor" → /login            [codigo] ──"Já tenho conta"→ /login
                                                                 │  < 6 car. → ajuda local
                                                                 │  404 → "Código de turma inválido…"
                                                                 │  rede/5xx → "Não foi possível verificar agora…"
 /convite/X → [validando] ──válido──────────────┐                │ válido
                 │ inválido (campo vazio)        ▼                ▼
                 └──────────────→ [codigo]   [dados: passo 1] ⇄ [dados: passo 2] ──201──→ [sucesso] → /aluno/atividades
                                                ▲ Voltar → [codigo] (dados preservados)
```

| Resposta do POST | Comportamento |
|---|---|
| 201 | `salvarToken` → boas-vindas. O formulário é zerado (senha sai da memória) → `redirecionarPorPerfil` → `/aluno/atividades`. |
| 400/409 com `campos` | `setError` em cada campo. Vai ao passo do primeiro campo com erro (na ordem do formulário) e foca nele. No 409 de e-mail ou matrícula aparece o link "Já tenho conta? Entrar". |
| 422 | Erro em "Confirmar senha" (passo 2, foco no campo) |
| 404 (ou `campos.codigoTurma`) | Volta ao painel do código com a mensagem padrão; os dados do formulário continuam em memória |
| 503, rede, resposta inesperada | Alerta no topo da área de envio: "Não foi possível concluir agora. Tente de novo.", com o botão "Tentar de novo". Nada é apagado. |
| 429 | "Muitas tentativas. Aguarde alguns minutos." |

**Acessibilidade**
- "Sou aluno" tem `aria-expanded` e `aria-controls="pa-painel"`. O contêiner fica sempre montado.
- O foco é movido a cada transição: campo do código, título do passo, primeiro campo inválido, região de erro geral ou título da boas-vindas.
- Regiões vivas que existem antes de qualquer mensagem: um `role="status"` (`aria-live="polite"`) na raiz da ilha para o código (limpo antes de reanunciar a mesma frase) e um `role="alert"` para o erro geral do envio.
- Cada campo tem label visível, `aria-invalid` e `aria-describedby` (erro + dica).
- Avatar: `fieldset` com `role="radiogroup"` e radios nativos `sr-only` (Tab entra, setas trocam), cada um com rótulo "Sabiá azul" etc.
- Botão mostrar/ocultar senha: entra na ordem de Tab, tem `aria-pressed` e 48 px de área.
- Envio: botão desabilitado com `aria-busy` e guarda contra duplo envio.
- Movimento: `rise` reaproveitado; `pop`/`brilho` entram no bloco `prefers-reduced-motion`, que já zera transições em `.page *`; spinners e skeleton usam `motion-reduce:animate-none`.

**Dados:** nada do formulário vai para `localStorage`/`sessionStorage`; só o token, via `salvarToken`.

## 5. Evidências

### 5.1 Lint, type-check e build (container `node:22-alpine`, pnpm, lockfile congelado)
```
pnpm lint        → LINT_EXIT=0   (eslint .: 0 problemas)
pnpm type-check  → TC_EXIT=0
pnpm build       → BUILD_EXIT=0  (Next.js 16.2.7, Turbopack)

Route (app)
┌ ○ /                      ← continua estática
├ ƒ /convite/[codigo]      ← dinâmica
├ ○ /login
…
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Problemas encontrados e corrigidos durante a validação:
- `react-hooks/refs` (React 19): o pedido de foco passou de `ref` para estado.
- O TS 5.5 inferiu *type predicate* no `refine` do avatar e estreitou o tipo. O retorno foi anotado como `boolean`.

### 5.2 Validação em execução, capturas, teclado e reduced-motion — **pendentes**
O Docker Desktop caiu antes do primeiro cenário, então nada disso foi executado. **Não há capturas de tela.** Também não foram criados registros no banco (antes da tentativa: `auth.usuario` = 9, max id 9; `turma_aluno` = 1, max id 30), logo não há o que limpar.

### 5.3 Roteiro E2E pronto (não executado)
Arquivos no scratchpad desta sessão:
- `C:\Users\eduar\AppData\Local\Temp\claude\C--Dev-sabia-tcc\ea15ffa0-ddb1-46ea-b3b2-40799183cf13\scratchpad\e2e\e2e.mjs`: cenários e verificações (Playwright/Chromium headless).
- `C:\Users\eduar\AppData\Local\Temp\claude\C--Dev-sabia-tcc\ea15ffa0-ddb1-46ea-b3b2-40799183cf13\scratchpad\e2e\run.sh`: dentro de `mcr.microsoft.com/playwright:v1.52.0-noble` na rede `sabia-tcc_default`. Faz o build de produção com `NEXT_PUBLIC_API_URL=http://localhost:8000` e `NEXT_PUBLIC_PEDAGOGICO_API_URL=http://localhost:8000/api/pedagogico`, sobe `server.js` (standalone) e o proxy, e roda o E2E.
- `C:\Users\eduar\AppData\Local\Temp\claude\C--Dev-sabia-tcc\ea15ffa0-ddb1-46ea-b3b2-40799183cf13\scratchpad\e2e\proxy.mjs`: `localhost:8000` → `api-gateway:8000`, para manter a origem `localhost:3000` aceita pelo CORS.
- `C:\Users\eduar\AppData\Local\Temp\claude\C--Dev-sabia-tcc\ea15ffa0-ddb1-46ea-b3b2-40799183cf13\scratchpad\e2e\orquestrador-503.sh`: no host, para e religa o `pedagogico-service` quando o E2E sinaliza (503 real).

Cobertura prevista:
- **Capturas** em 360/768/1440 dos estados inicial, código, erro de código, passo 1, passo 2 e sucesso, mais `/aluno/atividades`.
- **Cenário A (home) e cenário B (link):** validando, link inválido e metadata.
- **Erros do POST:** 409 de e-mail (com maiúsculas) e de matrícula, com link e foco; senhas divergentes; 422/429/rede/400/404 simulados para o mapeamento; 503 real com nova tentativa após ~12 s e dados preservados.
- **Navegação:** fluxo completo só com teclado.
- **Movimento e layout:** `document.getAnimations()` = 0 com reduced-motion; ausência de scroll horizontal em cada estado; telas baixas 360×560 e 1024×600.
- **Limpeza:** lista os e-mails criados (`e2e.*@sabia.edu`) para remoção.

## 6. Avatares: provisório e como trocar

- **Provisório:** não existe `src/public/images/avatares/`. Cada avatar é um sabiá estilizado em SVG (`AvatarSabia.tsx`) dentro de um círculo na cor do id.
  - As cores azul, laranja, verde, amarelo e roxo vêm da paleta do hero; rosa (`#ef6aa8`), vermelho (`#e5484d`) e turquesa (`#20b2aa`) foram acrescentadas.
  - Os ids são os 8 do backend (`AvatarCatalogo`).
- **Para trocar:**
  1. Salve as artes em `src/public/images/avatares/<id>.png` (ou `.webp`/`.svg`).
  2. Em `src/lib/avatares.ts`, importe cada uma (`import sabiaAzul from '@/public/images/avatares/sabia-azul.png'`) e preencha `imagem: sabiaAzul`.
  3. Pronto: `AvatarSabia` passa a renderizar `next/image` sem mudança na UI. As imagens devem ser quadradas, com o personagem centralizado.

## 7. Pendências e riscos

- **⚠ E2E, capturas, teclado e reduced-motion não executados** (Docker Desktop fora do ar). É o primeiro passo quando o Docker voltar, usando o roteiro do §5.3.
- **Container `sabia_web` não reconstruído:** ele copia o código no build (sem volume), então precisa de `docker compose up -d --build web` para refletir esta entrega.
- **Limitação aceita (issue E):** um aluno **já logado** que abre `/convite/X` vê o formulário de cadastro. "Entrar na turma com a conta atual" fica para a issue E.
- **Sem rate limiting** no backend até a issue G. O front já trata 429 com mensagem genérica.
- **Após um 503,** o auth-service pode responder 503 por ~10 s (cache negativo de DNS da JVM). A UI preserva os dados e oferece "Tentar de novo"; não há retentativa automática.
- **`:has()` no CSS:** suportado em Chrome/Edge 105+, Safari 15.4+, Firefox 121+. Em navegadores antigos, o formulário funciona, mas a arte de blocos e o título não encolhem (o painel fica mais abaixo na página).
- **Preexistentes (só registrados, não corrigidos):**
  - No `LoginForm` e no `RedefinirSenhaForm`, o botão mostrar/ocultar senha tem `tabIndex={-1}` (inacessível por teclado) e área de toque de ~16 px. O novo `CampoSenha` não repete isso; o login continua idêntico, como pedido.
  - O script `test` do `web/package.json` chama `jest`, que não está nas dependências. Não há infraestrutura de testes, então nenhum teste automatizado foi criado (o schema zod e o mapeamento de erros ficam sem teste unitário).
  - `/aluno/atividades` usa `px-8` e um painel lateral fixo; no celular, convém revisar (fora do escopo).

## 8. Descrição de PR

**Título:** `feat(web): primeiro acesso do aluno — escolha de perfil, código da turma e /convite/[codigo] (HU003.3, HU003.4)`

```markdown
## Contexto
HU003.3 e HU003.4: o visitante escolhe quem é na home; o aluno informa o código da turma
(ou abre o link de convite do professor) e cria a conta no primeiro acesso, sem CPF.
Usa os endpoints das issues B e C via gateway.

## O que muda
- **Home** (`/`, continua estática): o CTA vira a ilha `EntradaAluno` com "Sou aluno" (amarelo 3D,
  aria-expanded/aria-controls) e "Sou professor ou diretor" (→ /login). Hero extraído para `HomeShell`,
  sem mudança visual.
- **Painel do código**: maiúsculas automáticas, aceita colar com espaços, ajuda local para menos de 6
  caracteres, 404 com a mensagem do backend, erro de rede amigável.
- **Dados em 2 passos** ("Conte sobre você" / "Crie seu acesso"): nome, matrícula, nascimento, avatar
  (radiogroup nativo, 8 sabiás), e-mail (seu ou do responsável), senha + confirmação com mostrar/ocultar.
  Validação zod por passo; Voltar não perde nada.
- **Erros do POST**: 400/409 no campo certo (com "Já tenho conta? Entrar" no 409), 422 em "Confirmar senha",
  404 volta ao código, 503/rede/429 com mensagem no topo e "Tentar de novo" sem apagar dados.
- **Boas-vindas** curta e festiva → "Ir para minhas atividades" (/aluno/atividades).
- **/convite/[codigo]** (dinâmica, noindex): valida ao abrir e vai direto aos dados, ou ao painel do código
  com o erro.
- Avatares provisórios em SVG; troca pelas artes finais em um único arquivo (`lib/avatares.ts`).
- Acessibilidade: foco gerenciado a cada passo, regiões aria-live pré-montadas, labels visíveis,
  aria-invalid/aria-describedby, alvos ≥ 48 px, contraste AA, nada anima com reduced-motion.

## Fora de escopo
Entrar na turma com a conta atual (aluno já logado), `?redirect=`, guard de aluno sem turma, dashboard
(issues E/F). Rate limiting (issue G).

## Como testar
- `pnpm lint`, `pnpm type-check`, `pnpm build` (`/` ○, `/convite/[codigo]` ƒ).
- Com a stack no ar: `/` → Sou aluno → `SABIA1` → dados → sucesso → /aluno/atividades;
  `/convite/SABIA1` e `/convite/ZZZZZZ`; e-mail `aluno@sabia.edu` (409); pedagogico parado (503) e nova tentativa.

> ⚠ A validação E2E com capturas ainda não foi executada (Docker indisponível na hora da entrega);
> roteiro em `docs/resultado-front-primeiro-acesso.md` §5.3.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
