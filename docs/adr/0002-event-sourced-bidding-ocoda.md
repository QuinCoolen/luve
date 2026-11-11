# 0002: Event-source bidding with @ocoda/event-sourcing

**Status:** accepted (2026-11)

## Context

A bid is naturally an event: "bidder X offered €Y at time T". The old API stored bids as rows and updated the auction's price in a separate save, so two concurrent bids could both be accepted. Bidding needs a hard consistency boundary per auction, and its history is the product (bid history, "you've been outbid", replays).

## Decision

- Bidding is the only event-sourced service. One aggregate per auction (`AuctionBidding`, stream `bidding-{auctionId}`), CQRS with separate read models.
- Use [`@ocoda/event-sourcing`](https://github.com/ocoda/event-sourcing) 4.x with its Postgres store: aggregates, typed command/query buses, snapshots, optimistic concurrency, and a **gap-safe global position** (`readAll`).
- Concurrency control is the stream's expected version. On a conflict the command reloads and decides again.
- ocoda's in-process publishing is at-most-once, so **read models and outgoing integration events are pulled** from `readAll` with checkpoints. Projections update their read model and checkpoint in one transaction.
- The event store lives in its own Postgres schema (`eventstore`), next to the Prisma-managed read models in `public`.
- The other services stay state-based (plain Prisma). Event sourcing is used where it pays off, not everywhere.

## Consequences

- "Two bids can't both win" is enforced by the store, not by locks in application code.
- Read models can be rebuilt by replaying, and "state of the auction at time T" is a replay up to that point.
- More moving parts in one service: projector, relay, checkpoints, snapshots, and leader election (Postgres advisory lock) for the tailers.
- ocoda 4.x requires NestJS 12 and ESM, which drove [ADR 0003](0003-nestjs-12-esm-standard-schema.md).
- Stored events are never edited, so event changes are additive or versioned.
