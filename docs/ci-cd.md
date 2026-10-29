# Pipeline de imagens (GHCR)

Workflow: `.github/workflows/docker-publish.yml`. O servidor nunca faz build: só `docker pull`.

## Quando roda

- push em `release` ou `main`, tag `v*` ou manualmente (Actions → "Publicar imagens (GHCR)" → Run workflow).
- Job **testes**: `./mvnw -B test` em `auth-service` e `pedagogico-service` (JDK 21). Se falhar, nada é publicado.
- Job **publicar**: constrói as 5 imagens (`linux/amd64`, cache do buildx no GitHub) e envia ao GHCR com o `GITHUB_TOKEN` do próprio workflow. O front não roda `pnpm test` (jest ainda não está instalado).

## Imagens e tags

`ghcr.io/<owner>/sabia-<nome>`, com o owner em minúsculas (ex.: `ghcr.io/edukaique/sabia-web`):

| Imagem | Contexto | Porta interna |
|---|---|---|
| `sabia-web` | `web/` (alvo `runner`) | 3000 |
| `sabia-api-gateway` | `api-gateway/` (alvo `runner`) | 8000 |
| `sabia-auth-service` | `auth-service/` | 8080 |
| `sabia-pedagogico-service` | `pedagogico-service/` | 8081 |
| `sabia-ia-service` | `ia-service/` | 8002 |

Tags de cada build:

- `sha-<7 primeiros caracteres do commit>`: sempre; é a tag para fixar versão e fazer rollback.
- `release` ou `main`: o nome da branch do push.
- `latest`: só em push na `main`.
- `1.2.3`: em tag git `v1.2.3`.

O web é construído com URLs relativas (`NEXT_PUBLIC_API_URL` vazio e `NEXT_PUBLIC_PEDAGOGICO_API_URL=/api/pedagogico`), então a mesma imagem serve qualquer IP ou domínio atrás do proxy.

## Acesso do servidor ao GHCR

Os pacotes do GHCR nascem privados. No servidor, use um token só de leitura:

1. GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate new token.
2. Marque apenas `read:packages` e defina uma validade.
3. No servidor:
   ```bash
   echo "<TOKEN>" | docker login ghcr.io -u <usuario-github> --password-stdin
   ```
   O login fica em `~/.docker/config.json` do usuário que roda o `docker compose`.

Não use esse token em mais nada nem o coloque em arquivos do repositório.

## Rollback

1. Ache a tag da versão boa: aba Actions (o resumo de cada execução lista as tags) ou a página do pacote no GitHub (`sha-xxxxxxx`).
2. No compose de produção, troque a tag das imagens afetadas de `release` para `sha-xxxxxxx` (ou exporte a variável de tag usada no compose).
3. `docker compose pull && docker compose up -d`.

Para voltar ao fluxo normal, restaure a tag `release` (ou `latest`) e repita o passo 3.
