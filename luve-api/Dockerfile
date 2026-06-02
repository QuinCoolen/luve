# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (cached layer) -------------------------
FROM node:22-alpine AS deps
RUN npm install -g pnpm@10.15.0
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json ./
RUN pnpm install --ignore-scripts

# ---- build: generate Prisma client + compile TypeScript --------------------
FROM node:22-alpine AS build
RUN npm install -g pnpm@10.15.0
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `build` runs `prisma generate && nest build` (see package.json).
RUN pnpm run build

# ---- runtime: slim image that runs migrations then the server --------------
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
EXPOSE 5218
# Apply pending migrations, then start. `prisma migrate deploy` is the
# production-safe, non-interactive migration command.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
