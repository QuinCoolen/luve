# 0001: Microservices, in one monorepo

**Status:** accepted (2026-11)

## Context

Luve started as a Next.js frontend and a .NET API, with a plan to replace the API with a single NestJS app. The project exists to learn and show backend architecture, not to serve real users. A modular monolith would be faster to build. Microservices force the interesting problems into the open: data ownership, asynchronous messaging, eventual consistency, independent deployment.

Microservices are often paired with one repository per service "so each can have its own CI/CD".

## Decision

- Split the backend into services by business capability: identity, auctions, bidding, payments, realtime (and later notifications). Each owns its database and publishes events.
- Keep everything in **one repository**: pnpm workspaces + Turborepo, with shared code in `packages/` (`service-kit`, `contracts`, `messaging`).
- Give **each service its own pipeline** anyway: a path-filtered workflow per service calling one reusable workflow, producing its own image.

## Consequences

- Independent deployability comes from the architecture (own database, versioned event contracts, own image), not from the repo layout. A path-filtered workflow per service gives the same CI/CD isolation as separate repos.
- A change that spans services (e.g. a new event and its consumer) is one atomic PR, and shared contracts need no package registry.
- Risk: services importing each other's code. Mitigation: services only import from `packages/*`; check it in review.
- Changes to `packages/**` trigger every service's pipeline. That's intended: they all depend on it.
- Operating cost is real (a local stack of ~10 containers, distributed debugging). Accepted for a learning project; tracing (OpenTelemetry) is on the roadmap to make it bearable.
