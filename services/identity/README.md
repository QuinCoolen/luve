# identity

Accounts, sessions and access-token signing. The only service that knows passwords; every other service trusts its tokens by verifying them against its public keys.

## API (`/api/v1`, Swagger UI at `/docs/identity`)

| Endpoint | Auth | |
|---|---|---|
| `POST /auth/register` | none | create account (argon2id), sign in, publish `identity.user-registered.v1` |
| `POST /auth/login` | none | sign in; unknown email and wrong password are indistinguishable (also in timing) |
| `POST /auth/refresh` | refresh cookie | rotate the refresh token, new access token |
| `POST /auth/logout` | refresh cookie | end the session, clear cookies |
| `GET /auth/me` | access token | the signed-in user |
| `GET /users/{id}` | none | public profile |
| `PATCH /users/me` | access token | change email/username → `identity.user-updated.v1` |
| `DELETE /users/me` | access token | delete account → `identity.user-deleted.v1` |
| `GET /.well-known/jwks.json` | none | public signing keys (outside `/api`, for services) |

## Sessions

- **Access token**: Ed25519 JWT `{ sub, username }`, 15 minutes, httpOnly cookie `jwt` (path `/`).
- **Refresh token**: 32 random bytes, stored only as a SHA-256 hash, 30 days (sliding), httpOnly cookie `refresh` scoped to `/api/v1/auth`.
- **Rotation**: every refresh revokes the presented token and issues a new one in the same *family*. The swap is a conditional update, so two concurrent refreshes can't both win.
- **Reuse detection**: presenting a revoked token again revokes the whole family (attacker and victim are both logged out). A token rotated less than `REFRESH_REUSE_GRACE_SECONDS` ago only gets a `409` ("retry with the current cookies"): that's two tabs refreshing at once, not theft.

## Events

Published through the transactional outbox (`@luve/messaging`), in the same transaction as the change, keyed by user id:

| Routing key | Data |
|---|---|
| `identity.user-registered.v1` | userId, email, username, registeredAt |
| `identity.user-updated.v1` | userId, email, username |
| `identity.user-deleted.v1` | userId |

## Scripts

```bash
pnpm --filter @luve/identity db:migrate      # create/apply a migration (prisma migrate dev)
pnpm --filter @luve/identity keys:generate   # write a stable Ed25519 signing key to .env
pnpm --filter @luve/identity seed            # alice@luve.dev / bob@luve.dev (Password123), via the API
pnpm --filter @luve/identity test            # unit + e2e against a real Postgres (Testcontainers, needs Docker)
```

Without `JWT_PRIVATE_KEY` the service generates an ephemeral key at startup: access tokens stop verifying after a restart and clients transparently refresh.
