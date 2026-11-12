# users

Public user profiles. The users service never sees passwords or email addresses. It keeps its own copy of what anyone may know about a user, built from the auth service's events.

## API (`/api/v1`, Swagger UI at `/docs/users`)

| Endpoint | Auth | |
|---|---|---|
| `GET /users/{id}` | none | public profile: id, username, join date |

Right after someone registers, their profile can take a moment to appear (the auth event is on its way).

## Events

Consumes from its own queue `luve.users` (src/profiles/auth-events.consumer.ts):

| Routing key | Effect |
|---|---|
| `auth.user-registered.v1` | create the profile (a second delivery changes nothing) |
| `auth.user-updated.v1` | update the username |
| `auth.user-deleted.v1` | delete the profile |

A message that breaks its contract, or fails for another reason, is rejected and ends up in `luve.dead-letters` (RabbitMQ UI, http://localhost:15673).

## Scripts

```bash
pnpm --filter @luve/users db:migrate         # create/apply a migration (prisma migrate dev)
pnpm turbo run test --filter=@luve/users     # e2e against a real Postgres + RabbitMQ (Testcontainers, needs Docker)
```
