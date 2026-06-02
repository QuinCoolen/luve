# Phase 1 — Skeleton + Contract Pipeline

Goal of this phase: a Nest server that boots, talks to Postgres, exposes `/health` and `/openapi.json`, and a Next.js frontend wired to generate a typed client from that spec. No business endpoints yet — we're proving the *machine* works end-to-end before pouring features into it.

When Phase 1 is done:

- `docker compose up` brings up Postgres + Redis + the API
- Hitting `http://localhost:5218/health/ready` returns 200
- `pnpm openapi:export` writes `luve-api/openapi.json`
- `pnpm --filter luve-web api:generate` regenerates `luve-web/src/api/generated/` from it
- The frontend boots with `QueryClientProvider` wrapping the app
- A throwaway "ping" command + query proves CQRS is wired
- CI fails if `openapi.json` or the generated client are stale

Tasks are grouped by area. Each is small enough to land in one PR.

---

## A. Repo setup

- [ ] **A1.** `cd luve && pnpm init -w` at the repo root to make it a pnpm workspace. Add `packages: ["luve-api", "luve-web"]` (or top-level paths) to `pnpm-workspace.yaml`. *Done when:* `pnpm install` from the root installs both projects' deps.
- [ ] **A2.** Add root-level `.editorconfig`, `.gitignore` additions for `node_modules`, `dist`, `.env*`, `coverage`.
- [ ] **A3.** Add top-level npm scripts: `dev` (concurrently runs api + web), `build`, `lint`, `test`, `openapi:export`, `api:generate`.

## B. NestJS scaffold

- [ ] **B1.** `pnpm dlx @nestjs/cli new luve-api --package-manager pnpm --strict`. Delete the example controller/service. *Done when:* `pnpm --filter luve-api start:dev` boots on port 3000 and serves "Hello World" gone.
- [ ] **B2.** Bump `tsconfig.json` to `"target": "ES2022"`, `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.
- [ ] **B3.** Install core runtime deps: `@nestjs/config @nestjs/cqrs nestjs-zod zod nestjs-pino pino-pretty helmet cookie-parser @nestjs/swagger @nestjs/terminus class-validator class-transformer`. (We keep `class-transformer` for Nest internals even though our DTOs are Zod.)
- [ ] **B4.** Install dev deps: `@types/cookie-parser supertest @testcontainers/postgresql`.
- [ ] **B5.** Change default port to `5218` via `process.env.PORT ?? 5218`.

## C. Config + env validation

- [ ] **C1.** `src/config/env.schema.ts` — Zod schema for all required env: `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `CORS_ORIGIN`, `COOKIE_DOMAIN`, `STRIPE_SECRET_KEY` (optional in dev), `STRIPE_WEBHOOK_SECRET` (optional in dev).
- [ ] **C2.** `src/config/config.module.ts` — `ConfigModule.forRoot({ validate: zodValidate, isGlobal: true })`. *Done when:* booting with a missing env var throws a readable error before Nest starts.
- [ ] **C3.** `.env.example` at `luve-api/` with every variable and a comment.
- [ ] **C4.** `.env` for local dev (gitignored), filled with dev-safe values.

## D. Bootstrap

- [ ] **D1.** `src/main.ts`: cookie-parser, helmet, CORS from `CORS_ORIGIN` with `credentials: true`, global `ZodValidationPipe` from `nestjs-zod`, URI versioning enabled (`type: VersioningType.URI, defaultVersion: '1'`), global prefix `'api'`.
- [ ] **D2.** Wire `LoggerModule` from `nestjs-pino`. Pretty in `NODE_ENV !== 'production'`, JSON otherwise. Request ID middleware that surfaces in every log line.

## E. Error handling

- [ ] **E1.** `src/common/filters/problem-json.filter.ts` — catches `HttpException`, `ZodError`, and `Error`. Maps to RFC 7807 `application/problem+json` body: `{ type, title, status, detail, instance, errors? }`. Sets the response content-type. *Done when:* hitting an unknown route returns problem-json shape, not Nest's default.
- [ ] **E2.** Register the filter globally in `main.ts`.

## F. Prisma + Postgres

- [ ] **F1.** `pnpm --filter luve-api add prisma @prisma/client` and `pnpm --filter luve-api exec prisma init --datasource-provider postgresql`.
- [ ] **F2.** Paste the schema from §5 of the plan (`User`, `Session`, `Auction`, `AuctionStatus` enum, `Bid`) into `prisma/schema.prisma`.
- [ ] **F3.** `pnpm --filter luve-api exec prisma migrate dev --name init`. *Done when:* the migration applies cleanly to the dev Postgres.
- [ ] **F4.** `src/prisma/prisma.service.ts` extends `PrismaClient` with `onModuleInit` calling `$connect()`. `prisma.module.ts` exports it as global.
- [ ] **F5.** `prisma/seed.ts` — creates one test user and one active auction. Wire `"prisma.seed"` in `package.json`. Verify `pnpm --filter luve-api exec prisma db seed` works.

## G. CQRS wiring (proof of life)

- [ ] **G1.** Import `CqrsModule` in `AppModule`.
- [ ] **G2.** Throwaway `PingCommand` + `PingHandler` + `PingedEvent` + a single event handler that logs. A `GET /api/v1/ping` controller endpoint dispatches the command and returns `{ ok: true }`. *Done when:* hitting the endpoint logs both the command handler and the event handler. Delete this scaffolding before Phase 2.

## H. OpenAPI export

- [ ] **H1.** In `main.ts`, build the `DocumentBuilder` config: title `Luve API`, version `1.0.0`, servers `http://localhost:5218`, cookie-auth security scheme registered (named `cookieAuth`, type `apiKey`, in `cookie`, name `jwt`).
- [ ] **H2.** Call `patchNestJsSwagger()` from `nestjs-zod` before building the document so Zod DTOs render as proper OpenAPI schemas.
- [ ] **H3.** Mount `SwaggerModule.setup('docs', app, document)` and expose the raw JSON at `GET /openapi.json`.
- [ ] **H4.** `src/openapi/export.ts` — boots the Nest app in spec-only mode (no `listen`), grabs the document, writes `luve-api/openapi.json`, exits 0. Wire as `pnpm --filter luve-api openapi:export`. *Done when:* the file appears with our `/ping` endpoint documented.

## I. Health checks

- [ ] **I1.** `src/health/health.module.ts` with `@nestjs/terminus`. `/health/live` is unconditional 200. `/health/ready` checks Prisma (`SELECT 1`) and Redis (`PING`).

## J. Redis client

- [ ] **J1.** Install `ioredis`. `src/redis/redis.module.ts` exposes a global `Redis` instance from `REDIS_URL`. (Used by health check now, throttler and BullMQ later.)

## K. Docker

- [ ] **K1.** `luve-api/Dockerfile` — multi-stage: `deps` (pnpm install, no devDeps), `build` (full install + `pnpm build`), `runtime` (`node:22-alpine`, copy `dist` + `node_modules`, `prisma migrate deploy` in entrypoint, then `node dist/main`).
- [ ] **K2.** `luve-api/.dockerignore`.
- [ ] **K3.** Root `docker-compose.yml` with services: `api` (build context `./luve-api`, port `5218`), `postgres` (`postgres:16-alpine`, volume), `redis` (`redis:7-alpine`). *Done when:* `docker compose up` boots all three and `curl localhost:5218/health/ready` returns 200.

## L. Frontend setup

- [ ] **L1.** `pnpm --filter luve-web add @tanstack/react-query @tanstack/react-query-devtools axios socket.io-client` and `pnpm --filter luve-web add -D orval`. Remove `@microsoft/signalr` from `package.json` (don't refactor `[id]/index.tsx` yet — that's Phase 5; just leave it broken if needed and pin the dep removal for after).
- [ ] **L2.** `luve-web/src/api/mutator/axios.ts` — exports a `customInstance` axios mutator with `baseURL` from `NEXT_PUBLIC_API_URL`, `withCredentials: true`, and a response interceptor that parses RFC 7807 errors into a typed `ApiError`.
- [ ] **L3.** `luve-web/orval.config.ts`:
  ```ts
  export default {
    luve: {
      input: '../luve-api/openapi.json',
      output: {
        target: 'src/api/generated/endpoints.ts',
        schemas: 'src/api/generated/schemas',
        client: 'react-query',
        httpClient: 'axios',
        mode: 'split',
        override: {
          mutator: { path: 'src/api/mutator/axios.ts', name: 'customInstance' },
          query: { useQuery: true, useInfinite: true, signal: true },
        },
      },
    },
  }
  ```
- [ ] **L4.** `luve-web/package.json` script: `"api:generate": "orval"`. *Done when:* running it after `openapi:export` produces typed hooks in `src/api/generated/`.
- [ ] **L5.** Commit `luve-web/src/api/generated/` to the repo. Add a comment at the top of `endpoints.ts` warning not to hand-edit.
- [ ] **L6.** `luve-web/pages/_app.tsx` — wrap with `QueryClientProvider` and add `ReactQueryDevtools` in dev. Single `QueryClient` instance with sensible defaults (`staleTime: 30_000`, `refetchOnWindowFocus: false`).

## M. End-to-end smoke

- [ ] **M1.** Use the generated `usePingControllerPing` (or whatever Orval names it) inside a `/dev/ping` page in `luve-web` to confirm the loop works. *Done when:* loading that page shows `{ ok: true }` fetched from the API via the generated hook. Delete the dev page before Phase 2.

## N. CI

- [ ] **N1.** GitHub Actions workflow `.github/workflows/ci.yml`: install pnpm, run `pnpm install`, lint, build `luve-api`, `pnpm openapi:export`, `pnpm --filter luve-web api:generate`, `git diff --exit-code` — fails if either artifact is stale.
- [ ] **N2.** Same job runs `pnpm --filter luve-api test` and `pnpm --filter luve-web build`.

## O. Cleanup before Phase 2

- [ ] **O1.** Delete the `PingCommand`/`PingHandler`/`/ping` scaffolding once auth is starting.
- [ ] **O2.** Delete the `/dev/ping` frontend page.
- [ ] **O3.** Tag the commit `phase-1-complete`.

---

## What we deliberately defer to Phase 2+

- Auth strategies (Phase 2)
- The `User`, `Auction`, `Bid` controllers (Phases 2-4)
- Throttler module (Phase 8 hardening, but the Redis client is ready)
- BullMQ (Phase 7)
- Real-time gateway (Phase 5)
- OpenTelemetry (Phase 8)
- Testcontainers integration tests beyond a smoke test (Phase 2 onward, per feature)

---

## Estimated effort

Roughly 2-4 focused days for one person, mostly mechanical. Heaviest pieces are the RFC 7807 filter (E1), the Orval config (L3-L4) — both have small "did I get it exactly right" surfaces that take a few iterations.

The payoff is that Phase 2 starts with "write a Zod DTO and a CQRS command" and the typed hook appears on the frontend automatically. Every subsequent phase rides on this rail.
