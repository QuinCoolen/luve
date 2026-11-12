# syntax=docker/dockerfile:1.7
#
# One Dockerfile for every NestJS service:
#   docker build -f services/Dockerfile --build-arg SERVICE=auth .
#
# 1. prune:   `turbo prune` cuts the monorepo down to the service and the
#             workspace packages it depends on (plus a pruned lockfile).
# 2. build:   install from the pruned lockfile, build with turbo, then
#             `pnpm deploy` copies the service with only its production deps.
# 3. runtime: a slim image with just that output.

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
RUN npm install -g pnpm@10.15.0 turbo@2.11.11
WORKDIR /repo

FROM base AS prune
ARG SERVICE
COPY . .
RUN turbo prune @luve/${SERVICE} --docker

FROM base AS build
ARG SERVICE
COPY --from=prune /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=prune /repo/out/full/ .
RUN turbo run build --filter=@luve/${SERVICE}
RUN pnpm --filter @luve/${SERVICE} deploy --prod --legacy /out

FROM node:${NODE_VERSION} AS runtime
# OpenSSL for Prisma's schema engine (migrate deploy) on Alpine.
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
CMD ["node", "dist/main.js"]
