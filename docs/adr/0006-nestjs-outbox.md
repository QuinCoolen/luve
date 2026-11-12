# 0006: Use @nestjs/outbox for the transactional outbox

**Status:** accepted (2026-11)

## Context

Every state-based service must publish integration events without the dual-write problem: "save, then publish" loses events when the process dies in between, and "publish, then save" announces changes that never committed. The fix is a transactional outbox: write the event as a row in the same transaction as the change, and let a relay publish committed rows.

The first plan was to hand-roll it (an outbox table per Prisma schema, a `FOR UPDATE SKIP LOCKED` poller). NestJS has since shipped an official [`@nestjs/outbox`](https://docs.nestjs.com/reliability/outbox) with a Postgres store that runs through Prisma's interactive transactions, a relay with leases (safe with several instances), retries with backoff, a dead-letter table and a consumer inbox.

## Decision

- Use `@nestjs/outbox` with `PostgresOutboxStore` + `fromPrisma(prisma)`. Its tables live in a `nest_outbox` schema in each service's own database, so Prisma Migrate never sees them.
- Publish to RabbitMQ through a custom `OutboxTransport` (`RabbitMqOutboxTransport` in `@luve/messaging`). golevelup publishes on a confirm channel, so the relay only marks a message published once the broker acknowledged it.
- Wrap it in `IntegrationEvents.stage(tx, Contract, data, { key, correlationId })`: it validates `data` against the `@luve/contracts` schema, builds the envelope (UUIDv7 `eventId`, producer, timestamps) and calls `outbox.add(tx, …)`. The ordering `key` (e.g. the user id) keeps one aggregate's events in commit order.
- The store applies its own migrations at startup in every environment. A real deployment would run `npx @nestjs/outbox migrate` before rolling out; for this project, startup migration is simpler.

## Consequences

- Leases, fencing, retries, dead letters and graceful shutdown come from a maintained library instead of ~200 lines of our own concurrency code.
- The learning value stays visible: the pattern lives in `stage()` (inside the transaction) and in the transport (after commit), and the `luve.audit` queue shows every event that made it out.
- The library is young (0.1.x); the `OutboxTransport` boundary keeps a swap to a hand-rolled relay cheap.
- Bidding doesn't use it: its events already live in the event store, and the relay there tails `readAll` instead ([ADR 0002](0002-event-sourced-bidding-ocoda.md)).
