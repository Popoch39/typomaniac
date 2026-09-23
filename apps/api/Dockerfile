# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM oven/bun:1.4.2 AS build

WORKDIR /app

# Cache packages
COPY package.json package.json
COPY bun.lock bun.lock

COPY apps/api/package.json ./apps/api/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

# --ignore-scripts: skip the root `prepare` (lefthook needs git)
RUN bun install --frozen-lockfile --ignore-scripts

COPY apps/api ./apps/api
COPY packages/typescript-config ./packages/typescript-config

ENV NODE_ENV=production

WORKDIR /app/apps/api

# bun build --compile --minify-whitespace --minify-syntax --outfile dist/server src/index.ts
RUN bun run build

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/apps/api/dist/server server
# Migrations are applied at startup
COPY --from=build /app/apps/api/drizzle drizzle

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
