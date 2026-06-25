FROM node:22-alpine AS dev

ENV CI=true

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]