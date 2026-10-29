FROM node:22-alpine AS dev

ENV CI=true

# Mesma versão que gerou o pnpm-lock.yaml.
RUN corepack enable pnpm && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

CMD ["pnpm", "dev"]

# ---------- Produção (build no CI; nunca no servidor) ----------

FROM node:22-alpine AS deps

ENV CI=true

# Mesma versão que gerou o pnpm-lock.yaml.
RUN corepack enable pnpm && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Com scripts: o sharp (next/image) baixa o binário para musl.
RUN pnpm install --frozen-lockfile

FROM deps AS build

# Embutidas no bundle do browser. Padrão relativo: front e API na mesma origem
# atrás do proxy (/api/* -> api-gateway).
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_PEDAGOGICO_API_URL=/api/pedagogico
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_PEDAGOGICO_API_URL=$NEXT_PUBLIC_PEDAGOGICO_API_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=256 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Não há web/public/ (imagens vêm de src/public via import).
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", "server.js"]
