# 0004: One gateway origin with resource-based routes

**Status:** accepted (2026-11)

## Context

With five services, the browser would otherwise talk to five origins: CORS everywhere, cookies scoped per host, and a frontend that hard-codes the backend's internal layout.

## Decision

- Traefik is the single entry point on one origin (`localhost:8000`) for the web app, every API and websockets.
- Routes are **resource-based** (`/api/v1/auctions`, `/api/v1/auctions/{id}/bids`, …), not service-based (`/bidding-service/...`). Each service serves its full path, so nothing is rewritten; the bids rule outranks the auctions rule.
- Two dynamic route files: `infra/traefik/host` (services on the host via `pnpm dev`) and `infra/traefik/docker` (containers), selected with `TRAEFIK_DYNAMIC`.

## Consequences

- No CORS, and auth cookies are first-party.
- The service split is an implementation detail: moving an endpoint between services is a gateway change, not a client change.
- The gateway config must stay in sync with the services' routes; each service's OpenAPI document shows which paths it owns.
