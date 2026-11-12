# 0007: Split identity into auth and users

**Status:** accepted (2026-11), supersedes [0005](0005-identity-single-service.md)

## Context

[0005](0005-identity-single-service.md) kept accounts and profiles in one identity service, because a user is little more than an email, a username and a password. For this project the split is worth having anyway: it shows one service owning data and another keeping a copy of it, fed by events.

The open question was where the username lives. It's inside the access token and has to be unique at registration. If another service owned it, registering would need a synchronous call to that service (and an undo when the rest fails), or a two-step sign-up.

## Decision

- **auth** owns the account: email, username, password hash, sessions, token signing and the JWKS. Its endpoints are `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` and `/auth/me` (GET, PATCH, DELETE). It publishes `auth.user-registered`, `auth.user-updated` and `auth.user-deleted` through the outbox.
- **users** owns public profiles: a copy of each user's id, username and join date, built from those events. It serves `GET /users/{id}` and has no write endpoints.

## Consequences

- Registration stays one transaction in one service.
- A profile appears shortly after registration (usually milliseconds), not at the same instant: the users service is eventually consistent.
- users is the first event consumer. It has its own durable queue `luve.users`, and every write is safe to repeat instead of tracking processed event ids. Messages it can't handle go to the `luve.dead-letters` queue.
- Profile-only fields (avatar, bio) can be added to users later without touching auth.
