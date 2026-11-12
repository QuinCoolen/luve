# Roadmap

Each phase ships working code end to end (service + events + frontend) and gets its own detailed plan when it starts.

| # | Phase | Status |
|---|---|---|
| 0 | **Foundation**: monorepo (pnpm + Turborepo), NestJS 12 / ESM, service shells, Docker infra, Traefik gateway, per-service CI | done |
| 1 | **Auth + users**: register, login, refresh rotation with reuse detection, logout, account deletion, JWKS, JWT guard; users service with profiles (username via two-step sign-up), created and deleted by auth's events (first consumer, dead-letter queue); `@luve/contracts`, outbox publishing (`@nestjs/outbox` → RabbitMQ); gateway rate limit; web login/register switched over with silent refresh | done |
| 2 | **Auctions** *(next)*: create/list (cursor)/detail/mine, local copy of seller names (users starts publishing profile events), verify access tokens with auth's JWKS (third copy of the guard: copy it or extract a package, decided then); web auction pages switched over | planned |
| 3 | **Bidding**: event-sourced aggregate, commands/queries, projector + relay, closing scheduler + sweeper, cancellation saga; web bid form via REST | planned |
| 4 | **Realtime**: Socket.IO gateway fed by events; web moves from SignalR to socket.io-client | planned |
| 5 | **Payments**: Stripe checkout (winner only) + signed webhooks | planned |
| 6 | **Notifications, observability, hardening**: emails (Mailpit), OpenTelemetry traces across services (Grafana LGTM), Playwright E2E in CI; optionally health checks, structured logging and a shared error format | planned |
| 7 | **Extras**: anti-sniping, projection rebuild, "auction state at time T" replay, k6 load test on a hot auction, Kubernetes (k3d + Helm) | planned |

## Every phase includes

- Vitest unit tests (the bidding aggregate in given/when/then style).
- Integration tests with Testcontainers (real Postgres / RabbitMQ).
- Contract fixtures validated against `@luve/contracts`.
- Playwright flows against the running stack.

## Old app → new behaviour

The previous .NET backend had gaps that the rewrite fixes rather than ports: login never checked passwords, registration stored them in plain text, most write endpoints had no auth, Stripe marked auctions paid before payment, concurrent bids could race, and there was no refresh endpoint. On the frontend: the status enum didn't match the backend, prices showed `$` while Stripe charged EUR, and "logged in" meant "any cookie exists".
