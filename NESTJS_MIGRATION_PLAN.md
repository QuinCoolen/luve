# Luve — NestJS Backend Migration Plan (v2)

A plan for replacing `luve-api` (C# / .NET 9 / ASP.NET Core) with a NestJS backend, and regenerating the `luve-web` data layer against a new OpenAPI contract via Orval.

This is the second draft. The first assumed the frontend was untouchable; v2 inverts that — the frontend is in scope, we're going to redesign the API surface, and the contract pipeline becomes the spine of the project.

---

## 1. The shape of the rewrite

Three things are different from v1:

- **Frontend is in scope.** We add Orval, swap to TanStack Query, drop `@microsoft/signalr`, swap to `socket.io-client`, delete the hand-written `/services/api.ts`.
- **OpenAPI is the contract.** Nest is the source of truth — controllers + Zod DTOs — and emits `openapi.json` at build time. Orval consumes it and emits typed React hooks. Frontend never hand-writes API types again.
- **Architecture is CQRS-light, not plain CRUD.** Commands and events are first-class; state lives in Postgres. The auction domain pays this overhead back fast because bidding is event-shaped.

---

## 2. The contract pipeline

This is the central machine of the project. Everything else hangs off it.

```
luve-nest-api                               luve-web
─────────────────                           ──────────────────
Nest controllers                            orval.config.ts
+ Zod DTOs (nestjs-zod)                          │
       │                                         ▼
       ▼                                    @tanstack/react-query hooks
@nestjs/swagger      ────► openapi.json ───►     ▼ (generated)
       ▼                                    typed client functions
http://localhost:5218/docs                       ▼
                                            React components consume
```

**Practical flow:**

- `pnpm --filter luve-nest-api openapi:export` boots Nest in spec-only mode and writes `openapi.json` to disk.
- `pnpm --filter luve-web api:generate` runs `orval` against that file, emitting typed hooks + Zod runtime schemas + an axios mutator in `luve-web/src/api/generated/`.
- Both commands run in CI on every PR. A diff in `openapi.json` fails the build if the corresponding client hasn't been regenerated and committed.

**Orval config (target shape):**

- Client: `@tanstack/react-query`
- Mutator: shared axios instance with `withCredentials: true` for cookie auth
- Mock target: `msw` (gives us frontend tests without a running backend, optional)
- Runtime validation: emit Zod schemas alongside hooks, validate responses in dev only

---

## 3. The new API surface

Clean rewrite, `/api/v1` prefix, plural resources, real pagination, RFC 7807 errors.

### Conventions

- **Versioning**: `/api/v1/*`. Nest's `URI versioning` strategy.
- **Resources**: plural — `/users`, `/auctions`, `/bids`. The `/user` singular is gone.
- **Pagination**: cursor-based for hot lists (auctions sorted by `endDate`), offset for everything else. Query params `?cursor=...&limit=20` or `?page=1&pageSize=20`. Responses wrap data: `{ data: [...], pagination: { nextCursor: "..." } }`.
- **Filtering / sorting**: `?status=active&sort=-endDate`. Whitelisted per endpoint.
- **Errors**: RFC 7807 problem+json. `{ type, title, status, detail, instance, errors?: { field: string[] } }`.
- **Field casing**: camelCase on the wire (unchanged).
- **Enums on the wire**: strings, not numbers. `AuctionStatus` becomes `"active" | "unpaid" | "payment_pending" | "paid"`. The numeric enum was an EF Core artifact — strings are self-describing and Orval/Zod handle them cleanly.
- **Dates**: ISO 8601 strings.

### Endpoint inventory (v1)

**Auth** (`/api/v1/auth`)
- `POST /register` — create user, set cookies
- `POST /login` — set `jwt` and `refresh` cookies, return current user
- `POST /logout` — clear cookies
- `POST /refresh` — rotate refresh token, reissue access token
- `GET /me` — current user (was `/api/user/me`)

**Users** (`/api/v1/users`)
- `GET /:id` — public user profile (limited fields)
- `PATCH /me` — update own profile
- `DELETE /me` — delete own account

**Auctions** (`/api/v1/auctions`)
- `GET /` — list, with `?status&sort&cursor&limit`
- `POST /` — create (auth required)
- `GET /:id` — detail, includes bid history
- `PATCH /:id` — update own auction (auth required, ownership check)
- `DELETE /:id` — delete own auction
- `GET /mine` — auctions I created (auth)
- `GET /participating` — auctions I've bid on (auth)

**Bids** (`/api/v1/auctions/:auctionId/bids`)
- `GET /` — bid history for an auction
- `POST /` — place a bid (auth) — also reachable via WebSocket `placeBid` event; both go through the same `PlaceBidCommand`

**Payments** (`/api/v1/payments`)
- `POST /checkout-sessions` — create Stripe Checkout session for an auction
- `POST /webhooks/stripe` — Stripe webhook handler (raw body, signature-verified)

**Health** (`/health`)
- `GET /live` — liveness
- `GET /ready` — readiness (DB + Redis check)

**OpenAPI**
- `GET /docs` — Swagger UI
- `GET /openapi.json` — raw spec

---

## 4. Architecture: CQRS-light

`@nestjs/cqrs` gives us three concepts: **Commands** (mutate), **Queries** (read), **Events** (broadcast). State stays in Postgres — no event store, no rehydration, no projections.

### How it maps to the domain

- `RegisterUserCommand` → creates user, emits `UserRegisteredEvent`
- `PlaceBidCommand` → validates (auction active, bid > current + increment, not own auction), writes Bid row, updates `auction.currentPrice`, emits `BidPlacedEvent`
- `BidPlacedEvent` is consumed by:
  - `RealtimeBroadcastHandler` — emits Socket.IO `bid_placed` to the auction's room
  - `AuctionHotnessHandler` — bumps a cache later if we want trending sort
  - (Later) `OutbidNotificationHandler` — emails the previous high bidder
- `ExpireAuctionsCommand` (fired by BullMQ) → flips status, emits `AuctionExpiredEvent`
- `AuctionExpiredEvent` → `RealtimeBroadcastHandler` notifies the room, `NotifyWinnerHandler` (later) sends an email

The handlers are isolated. Adding "send a Slack message on every bid" is a new event handler, not a change to bidding logic.

### What CQRS-light does NOT include

- No event store. Postgres rows are still the truth.
- No separate read database. Queries hit the same Prisma client.
- No eventual consistency between write and read sides.
- No aggregate rehydration from events.

This is intentional — these are the things that make full ES expensive and we don't need them yet.

---

## 5. Other decisions

### Runtime
Node 22 LTS, TypeScript 5.5 with `strict: true`, pnpm.

### Project layout
Sibling project `luve-nest-api` next to `luve-api` and `luve-web`. Top-level `docker-compose.yml` brings up Postgres + Redis + the API.

### Database
**Postgres** (confirmed). Better Node ecosystem, every ORM is first-class, smaller hosting bill. One-time data migration from SQL Server (small dataset, ~20-line script).

### ORM
**Prisma.** Best DX, generated client is type-safe end-to-end, migrations are dependable. Drizzle is faster but lacks first-class Nest integration; TypeORM is closer to EF Core in feel but has rougher edges.

### Schema (initial)

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  auctions     Auction[] @relation("AuctionSeller")
  bids         Bid[]
  sessions     Session[]
}

model Session {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshTokenHash String   @unique
  userAgent        String?
  ip               String?
  expiresAt        DateTime
  createdAt        DateTime @default(now())
}

enum AuctionStatus {
  ACTIVE
  UNPAID
  PAYMENT_PENDING
  PAID
}

model Auction {
  id            String        @id @default(cuid())
  title         String
  description   String
  startingPrice Decimal       @db.Decimal(12, 2)
  currentPrice  Decimal       @db.Decimal(12, 2)
  increment     Decimal       @db.Decimal(12, 2)
  status        AuctionStatus @default(ACTIVE)
  imageUrl      String
  endDate       DateTime
  sellerId      String
  seller        User          @relation("AuctionSeller", fields: [sellerId], references: [id])
  bids          Bid[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  @@index([status, endDate])
  @@index([sellerId])
}

model Bid {
  id        String   @id @default(cuid())
  amount    Decimal  @db.Decimal(12, 2)
  time      DateTime @default(now())
  auctionId String
  auction   Auction  @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  @@index([auctionId, time])
}
```

Notes: money as `Decimal(12,2)` not `Float` — never float for currency. IDs as CUIDs not autoincrement ints — opaque, URL-safe, no enumeration leak.

### Authentication
Passport with two strategies: `LocalStrategy` for `/auth/login`, `JwtStrategy` reading from the `jwt` httpOnly cookie. Passwords hashed with `argon2id`. Existing bcrypt hashes verified and transparently rehashed on first login during migration window.

### Refresh tokens
Session table, refresh token SHA-256 hashed at rest, multi-session per user, rotation on every refresh. Frontend doesn't change.

### Validation
**Zod + `nestjs-zod`.** Same library the frontend already uses. `nestjs-zod` generates OpenAPI schemas from Zod DTOs, which Orval then turns into typed hooks. One schema, three artifacts.

### Configuration
`@nestjs/config` with a top-level Zod schema validating env at boot. Required: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CORS_ORIGIN`, `COOKIE_DOMAIN`.

### Errors
Global exception filter shaping every error into RFC 7807. `type` is a URI fragment (`/errors/validation`), `title` is human-readable, `errors` is field-keyed for validation failures. Orval's Zod schemas will validate the response shape on the client.

### Rate limiting
`@nestjs/throttler` with Redis backend. Tight on auth endpoints (10/min/IP for login and register), tighter on `placeBid` (1/sec/user, 20/min/user), loose on reads (100/min/IP).

### CORS & security
`origin: process.env.CORS_ORIGIN`, `credentials: true`. `helmet` for headers. `cookie-parser` global. Cookies: `httpOnly`, `secure` in prod, `sameSite: 'lax'`, names `jwt` and `refresh` (compatibility doesn't matter now since the frontend is regenerated, but the names are still fine).

### Real-time
Socket.IO via `@nestjs/websockets` + `@nestjs/platform-socket.io`. Auth via cookie at handshake time (a `WsAuthGuard` reads the `jwt` cookie). Rooms named `auction:${id}`. Events:

- Client → Server: `auction:join`, `auction:leave`, `bid:place`
- Server → Client: `bid:placed`, `auction:status_changed`

The `bid:place` event fires `PlaceBidCommand` — same code path as the REST endpoint. `BidPlacedEvent` is emitted to the room.

### Background jobs
**BullMQ on Redis.** Each new auction schedules a delayed `expire-auction` job at `endDate`. Job handler fires `ExpireAuctionCommand`. Survives restarts, scales horizontally, has retries and dead-letter for free.

### Payments
Stripe Node SDK. `POST /payments/checkout-sessions` creates the session. `POST /payments/webhooks/stripe` (raw body, signature-verified) flips status `PAYMENT_PENDING → PAID` on `checkout.session.completed`. The frontend just opens the returned `url` — no change needed in payment flow.

### Logging
`nestjs-pino`. Pretty-printed in dev, JSON in prod. Request ID injected via middleware, propagated through CQRS handlers.

### Observability
OpenTelemetry SDK behind an env flag. `@nestjs/terminus` for `/health/live` and `/health/ready`.

### Testing
- Jest for unit (default Nest tooling, ecosystem assumes it).
- Supertest for integration.
- Testcontainers for real Postgres + Redis in tests — no SQLite mocks, no in-memory shortcuts.
- Existing Playwright suite in `luve-web/tests/` is the regression net for the cutover.

### Deployment
Multi-stage Dockerfile (`deps → build → runtime`). `node:22-alpine` base. `prisma migrate deploy` runs before the app starts. Expose any port the frontend env points at — `5218` for parity is fine.

---

## 6. Frontend changes (new section)

The frontend is no longer pinned. Concrete diffs:

**Install:**
- `@tanstack/react-query` + `@tanstack/react-query-devtools`
- `axios` (Orval mutator)
- `socket.io-client`
- `-` remove `@microsoft/signalr`

**Add:**
- `orval.config.ts` at the frontend root, pointing at `../luve-nest-api/openapi.json`
- `package.json` script: `"api:generate": "orval"`
- `src/api/mutator/axios.ts` — shared axios instance with `withCredentials: true` and the RFC 7807 error parser
- `src/api/generated/` (gitignored or committed — we'll pick) — Orval output
- `src/realtime/socket.ts` — single Socket.IO client factory

**Replace:**
- `services/api.ts` — delete, the generated hooks replace it
- `context/auth.tsx` — call `useLoginMutation()`, `useMeQuery()` from the generated client instead of hand-written fetch
- `pages/auctions/[id]/index.tsx` — swap the SignalR `HubConnectionBuilder` block for the Socket.IO client, swap `JoinBid` for `socket.emit('auction:join', id)`, listen for `bid:placed`
- All `getServerSideProps` data loads — call the generated client functions directly (not the hooks)
- Enum usage — `AuctionStatus.NotFinished` → `"active"` (string union now, no more numeric enum)
- `_app.tsx` — wrap with `QueryClientProvider`

**Keep:**
- Cookie-based auth, `withCredentials` everywhere — same flow
- All UI components, all pages, all forms — the data layer is the only thing that changes

This is maybe a day of focused refactor work on the frontend, almost all mechanical. The Playwright suite catches regressions.

---

## 7. Module layout

```
luve-nest-api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── env.schema.ts          # Zod-validated env
│   │   └── config.module.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── problem-json.filter.ts   # RFC 7807
│   │   ├── interceptors/
│   │   ├── guards/
│   │   │   ├── jwt-cookie.guard.ts
│   │   │   └── ws-auth.guard.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── pipes/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/
│   │   │   ├── jwt-cookie.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── commands/
│   │   │   ├── register-user.command.ts
│   │   │   ├── login.command.ts
│   │   │   └── refresh-session.command.ts
│   │   └── dto/                   # Zod DTOs
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── queries/
│   │   │   ├── get-user.query.ts
│   │   │   └── get-me.query.ts
│   │   └── commands/
│   │       ├── update-user.command.ts
│   │       └── delete-user.command.ts
│   ├── auctions/
│   │   ├── auctions.module.ts
│   │   ├── auctions.controller.ts
│   │   ├── commands/
│   │   │   ├── create-auction.command.ts
│   │   │   ├── update-auction.command.ts
│   │   │   └── expire-auction.command.ts
│   │   ├── queries/
│   │   │   ├── list-auctions.query.ts
│   │   │   ├── get-auction.query.ts
│   │   │   └── ...
│   │   └── events/
│   │       └── auction-expired.event.ts
│   ├── bids/
│   │   ├── bids.module.ts
│   │   ├── bids.controller.ts
│   │   ├── commands/
│   │   │   └── place-bid.command.ts
│   │   └── events/
│   │       └── bid-placed.event.ts
│   ├── realtime/
│   │   ├── realtime.module.ts
│   │   ├── auction.gateway.ts          # Socket.IO @WebSocketGateway
│   │   └── handlers/
│   │       └── bid-placed.handler.ts   # listens for BidPlacedEvent, broadcasts
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── checkout.controller.ts
│   │   ├── webhooks.controller.ts
│   │   └── stripe.service.ts
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   └── auction-expiry.processor.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── openapi/
│       └── export.ts              # boots Nest in spec-only mode, writes openapi.json
├── test/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 8. Data migration

1. Define Prisma schema, generate initial migration against empty Postgres.
2. Export from SQL Server: `bcp` or a one-off Node script using `mssql` package.
3. Transform: dates → `timestamptz`, identity ints → CUIDs (keep a mapping table during import for FK resolution), `AuctionStatus` int → enum string, BCrypt password hashes stay as-is, mark `passwordHashAlgo: 'bcrypt'` so the auth layer knows to rehash on next login.
4. Import via raw SQL or Prisma's `createMany`.
5. Verify row counts and spot-check.
6. Cutover: stop C# API, point `luve-web` env at NestJS, smoke test, done.

If the dataset is small (likely), this is one script that runs in a few seconds.

---

## 9. Phased delivery

Each phase ships an `openapi.json` change and a corresponding frontend regen.

1. **Skeleton.** Nest app, Prisma + Postgres, CQRS module wired, Zod + nestjs-zod, problem-json filter, Pino, helmet, CORS, health check, OpenAPI emitting at `/openapi.json`. Frontend: install TanStack Query, Orval, generate against empty spec.
2. **Auth.** Register, login, logout, refresh, `/me`. Argon2, session table. Frontend regenerated, auth context refactored, login flow works.
3. **Auctions read path.** List + detail + mine + participating, with pagination. Frontend list and detail pages work.
4. **Auctions write path.** Create, update, delete, status transitions.
5. **Bids + real-time.** `PlaceBidCommand`, REST endpoint, Socket.IO gateway, `BidPlacedEvent` broadcast handler. Frontend swaps SignalR for socket.io-client.
6. **Payments.** Checkout + webhook.
7. **Background expiry.** BullMQ schedule, `ExpireAuctionCommand`, `AuctionExpiredEvent` broadcast.
8. **Hardening.** Rate limits, OpenTelemetry, dockerfile, compose, CI pipeline that fails on uncommitted Orval regen.
9. **Data migration + cutover.**
10. **Decommission `luve-api`.**

---

## 10. Confirmed decisions

All resolved:

1. **Database:** Postgres.
2. **Redis:** in the stack — BullMQ, distributed throttling, future Socket.IO adapter.
3. **Generated client:** committed at `luve-web/src/api/generated/` so PR diffs surface contract changes.
4. **Refresh tokens:** session table, SHA-256-hashed at rest, multi-session, rotation on refresh.
5. **Stripe:** webhook-driven status flips, not redirect-trust.
6. **Project name:** `luve-api` (the C# project has been renamed to `luve-api-old`).

Phase 1 task breakdown lives in `PHASE_1_TASKS.md`.
