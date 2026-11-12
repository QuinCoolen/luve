# users

Everything about a person except how they log in (that's the auth service): for now the username, later things like a profile picture and location. Never sees passwords or email addresses.

## API (`/api/v1`, Swagger UI at `/docs/users`)

| Endpoint | Auth | |
|---|---|---|
| `GET /users/me` | access token | your profile; `username` is null until you've chosen one |
| `PATCH /users/me` | access token | set your username (409 if someone has it) |
| `GET /users/{id}` | none | anyone's public profile: id, username, join date |

Access tokens are issued by the auth service. `src/auth/jwt-auth.guard.ts` (a copy of auth's guard) checks them with auth's public keys, downloaded once from `AUTH_JWKS_URL`.

## Events

Consumes from its own queue `luve.users` (`src/profiles/auth-events.consumer.ts`):

| Routing key | Effect |
|---|---|
| `auth.user-registered.v1` | create the (empty) profile; a second delivery changes nothing |
| `auth.user-deleted.v1` | delete the profile |

A message that breaks its contract, or fails for another reason, is rejected and ends up in `luve.dead-letters` (RabbitMQ UI, http://localhost:15673).

## Scripts

```bash
pnpm --filter @luve/users db:migrate         # create/apply a migration (prisma migrate dev)
pnpm turbo run test --filter=@luve/users     # e2e against a real Postgres + RabbitMQ (Testcontainers, needs Docker)
```
