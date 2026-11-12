# 0005: Auth and users in one identity service

**Status:** superseded by [0007](0007-split-auth-and-users.md) (2026-11)

## Context

The first draft had separate auth and user services. In Luve a user is an email, a username and a password hash. Split, registration would span two services (credentials in one, profile in the other) for no real gain.

## Decision

One **identity** service owns credentials, sessions, profiles and token signing. It publishes `user-registered`, `user-updated` and `user-deleted`, so other services can keep the data they need (a seller's username, an email address).

## Consequences

- Registration is one transaction; something this simple needs no saga.
- Event-driven fan-out is still demonstrated, by the consumers of identity's events (auctions, notifications).
- If profiles grow (avatars, seller ratings, addresses), splitting a profile service off later is a straightforward move along an existing event boundary.
