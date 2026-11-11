# syntax=docker/dockerfile:1.7
#
# Next.js app, built from the monorepo root:
#   docker build -f apps/web/Dockerfile .

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
RUN npm install -g pnpm@10.15.0 turbo@2.11.11
WORKDIR /repo

FROM base AS prune
COPY . .
RUN turbo prune @luve/web --docker

FROM base AS build
COPY --from=prune /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=prune /repo/out/full/ .
# Standalone output (see next.config.ts). NEXT_PUBLIC_API_URL stays empty:
# the browser calls the API on the same origin, through the gateway.
ENV NEXT_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
RUN turbo run build --filter=@luve/web

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
