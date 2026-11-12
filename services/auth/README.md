# auth

How you log in: accounts (email + password), sessions and access tokens. The only service that knows passwords and email addresses. Everything else about a person (username, …) lives in the users service, which hears about new and deleted accounts through this service's events.

## API (`/api/v1`, Swagger UI at `/docs/auth`)

| Endpoint | Auth | |
|---|---|---|
| `POST /auth/register` | none | create account (argon2id), sign in, publish `auth.user-registered.v1` |
| `POST /auth/login` | none | sign in; unknown email and wrong password are indistinguishable (also in timing) |
| `POST /auth/refresh` | refresh cookie | rotate the refresh token, new access token |
| `POST /auth/logout` | refresh cookie | end the session, clear cookies |
| `DELETE /auth/me` | access token | delete your account → `auth.user-deleted.v1` |
| `GET /.well-known/jwks.json` | none | public signing keys (outside `/api`), for other services to check tokens with |

## Sessions

Routes that need a signed-in user use `@UseGuards(JwtAuthGuard)` (`src/auth/jwt-auth.guard.ts`) and read the user with `@CurrentUser()`.

- **Access token**: Ed25519 JWT whose `sub` is your user id, 15 minutes, httpOnly cookie `jwt` (path `/`).
- **Refresh token**: 32 random bytes, stored only as a SHA-256 hash, 30 days (sliding), httpOnly cookie `refresh` scoped to `/api/v1/auth`.
- **Rotation**: every refresh revokes the presented token and issues a new one in the same *family*. The swap is a conditional update, so two concurrent refreshes can't both win.
- **Reuse detection**: presenting a revoked token again revokes the whole family (attacker and victim are both logged out). A token rotated less than `REFRESH_REUSE_GRACE_SECONDS` ago only gets a `409` ("retry with the current cookies"): that's two tabs refreshing at once, not theft.

## Events

Published through the transactional outbox (`@luve/messaging`), in the same transaction as the change, keyed by user id:

| Routing key | Data |
|---|---|
| `auth.user-registered.v1` | userId, email, registeredAt |
| `auth.user-deleted.v1` | userId |

## Scripts

```bash
pnpm --filter @luve/auth db:migrate         # create/apply a migration (prisma migrate dev)
pnpm --filter @luve/auth keys:generate      # write a stable Ed25519 signing key to .env
pnpm turbo run test --filter=@luve/auth     # unit + e2e against a real Postgres (Testcontainers, needs Docker)
```

Demo users are created with `pnpm seed` from the repo root (it uses both auth and users).

Without `JWT_PRIVATE_KEY` the service generates an ephemeral key at startup: access tokens stop verifying after a restart and clients transparently refresh.
