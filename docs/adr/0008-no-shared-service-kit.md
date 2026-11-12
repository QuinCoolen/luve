# 0008: No shared service kit

**Status:** accepted (2026-11)

## Context

Phase 0 added `@luve/service-kit`, a package every service booted from: env validation, logging, health checks, a problem+json error format, the JWT guard and the Swagger setup. Only one service had endpoints at the time, so the abstraction came before any real need for it. It was also code the project's author wouldn't have written themselves and couldn't comfortably explain, which defeats the point of a learning project.

## Decision

- Each service sets itself up: a plain `main.ts`, plus a `setup.ts` (routing under `/api/v1`, Zod validation, Swagger) once it has endpoints, using Nest's defaults (e.g. its default error body).
- The JWT guard lives in the auth service, the only one with protected routes.
- Shared packages are limited to what services must agree on: the event contracts (`@luve/contracts`) and the outbox wiring (`@luve/messaging`).
- Shared code gets extracted once the same code has been written two or three times and the duplication actually hurts ("rule of three"), not in advance.

## Consequences

- A few files repeat between auth and users (`setup.ts`, `zod-schema-converter.ts`, `prisma.service.ts`). That's accepted.
- When auctions needs to check logins (Phase 2), copy the guard over or extract it into a package then, as a deliberate decision.
- Health checks, structured logging and a shared error format are left out for now (roadmap Phase 6).
