# auth

Accounts, sessions and access-token signing. The only service that knows passwords and email addresses. Other services trust its tokens by verifying them against its public keys, and keep the user data they need from its events (the users service builds public profiles from them).

## API (`/api/v1`, Swagger UI at `/docs/auth`)

| Endpoint | Auth | |
|---|---|---|
| `POST /auth/register` | none | create account (argon2id), sign in, publish `auth.user-registered.v1` |
| `POST /auth/login` | none | sign in; unknown email and wrong password are indistinguishable (also in timing) |
| `POST /auth/refresh` | refresh cookie | rotate the refresh token, new access token |
| `POST /auth/logout` | refresh cookie | end the session, clear cookies |
| `GET /auth/me` | access token | the signed-in user |
| `PATCH /auth/me` | access token | change email/username → `auth.user-updated.v1` |
| `DELETE /auth/me` | access token | delete account → `auth.user-deleted.v1` |
| `GET /.well-known/jwks.json` | none | public signing keys (outside `/api`, for services) |

## Sessions

Routes that need a signed-in user use `@UseGuards(JwtAuthGuard)` (src/auth/jwt-auth.guard.ts) and read the user with `@CurrentUser()`.

- **Access token**: Ed25519 JWT `{ sub, username }`, 15 minutes, httpOnly cookie `jwt` (path `/`).
- **Refresh token**: 32 random bytes, stored only as a SHA-256 hash, 30 days (sliding), httpOnly cookie `refresh` scoped to `/api/v1/auth`.
- **Rotation**: every refresh revokes the presented token and issues a new one in the same *family*. The swap is a conditional update, so two concurrent refreshes can't both win.
- **Reuse detection**: presenting a revoked token again revokes the whole family (attacker and victim are both logged out). A token rotated less than `REFRESH_REUSE_GRACE_SECONDS` ago only gets a `409` ("retry with the current cookies"): that's two tabs refreshing at once, not theft.

## Events

Published through the transactional outbox (`@luve/messaging`), in the same transaction as the change, keyed by user id:

| Routing key | Data |
|---|---|
| `auth.user-registered.v1` | userId, email, username, registeredAt |
| `auth.user-updated.v1` | userId, email, username |
| `auth.user-deleted.v1` | userId |

## Scripts

```bash
pnpm --filter @luve/auth db:migrate         # create/apply a migration (prisma migrate dev)
pnpm --filter @luve/auth keys:generate      # write a stable Ed25519 signing key to .env
pnpm --filter @luve/auth seed               # alice@luve.dev / bob@luve.dev (Password123), via the API
pnpm turbo run test --filter=@luve/auth     # unit + e2e against a real Postgres (Testcontainers, needs Docker)
```

Without `JWT_PRIVATE_KEY` the service generates an ephemeral key at startup: access tokens stop verifying after a restart and clients transparently refresh.
