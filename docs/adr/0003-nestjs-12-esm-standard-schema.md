# 0003: NestJS 12, ESM and Zod via Standard Schema

**Status:** accepted (2026-11)

## Context

The first skeleton used NestJS 11 (CommonJS, Jest) with `nestjs-zod`. `@ocoda/event-sourcing` 4.x needs NestJS 12, ESM and Node ≥ 22.12. `nestjs-zod` doesn't support Nest 12, and Nest 12 validates and documents Standard Schema (Zod 4) natively.

## Decision

- All services and packages: NestJS 12, `"type": "module"` with `nodenext` resolution, TypeScript 6, Vitest, oxlint. Vite 8 emits the decorator metadata Nest DI needs, so tests need no SWC plugin.
- Validation: `@Body({ schema })` + Nest's `StandardSchemaValidationPipe`, with Nest's default 400 response (one `field: message` per problem).
- OpenAPI: Swagger 12 converts the schemas; `zod-openapi` hoists schemas with `.meta({ id })` into named components, so the Orval client gets readable type names.
- Shared packages compile to `dist` with `tsc`. NestJS is a peer dependency of shared packages and pinned once in the pnpm catalog, so there is exactly one copy of `@nestjs/core`.

## Consequences

- One schema per DTO serves validation, response shaping, OpenAPI and, through Orval, the frontend types.
- ESM details to remember: relative imports end in `.js`; inject classes through value imports (not `import type`) so decorator metadata survives.
- The web app stays on its own toolchain (Next.js, TypeScript 5) for now.
