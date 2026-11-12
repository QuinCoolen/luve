# 0007: Split identity into auth and users

**Status:** accepted (2026-11), supersedes [0005](0005-identity-single-service.md)

## Context

[0005](0005-identity-single-service.md) kept accounts and profiles in one identity service, because a user was little more than an email, a username and a password. Profiles are going to grow (a profile picture, a location, …), and those have nothing to do with logging in. Splitting also shows one service owning data while another learns about it through events.

The hard part is the username. It has to be unique, and the old sign-up form asked for it together with the email and password. If the users service owns usernames, a one-step sign-up would need auth to call users during registration (and undo that call when the rest fails).

## Decision

- **auth** owns how you log in: email, password hash, sessions, token signing and the JWKS. Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` and `DELETE /auth/me`. It publishes `auth.user-registered` and `auth.user-deleted` through the outbox.
- **users** owns everything else about a person, starting with the username. Endpoints: `GET /users/me`, `PATCH /users/me` and `GET /users/{id}`. It creates an empty profile when `auth.user-registered` arrives and deletes it on `auth.user-deleted`.
- **Two-step sign-up:** register with email and password, then choose a username (`PATCH /users/me`). No service calls another one.
- **Access tokens only carry the user id** (`sub`). The username isn't in the token, so changing it doesn't need a new token.
- users checks tokens with its own copy of the guard, using auth's public keys from `/.well-known/jwks.json`.

## Consequences

- Registration stays one transaction in one service, and auth knows nothing about profiles.
- A profile exists shortly after registration, not at the same instant. `PATCH /users/me` creates the profile if the event hasn't arrived yet; the event then only adds the registration date.
- Until a user picks a username, `username` is null. The web sends them to `/choose-username` after registering, and after logging in if it's still empty.
- users is the first event consumer: its own durable queue `luve.users`, writes that are safe to repeat, and rejected messages in `luve.dead-letters`.
- When another service needs usernames (auctions, for seller names), users will have to publish profile events too.
