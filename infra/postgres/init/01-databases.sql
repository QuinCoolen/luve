-- Runs once, when the Postgres data volume is empty (docker-entrypoint-initdb.d).
-- One database per service: services never read each other's tables.
CREATE DATABASE auth;
CREATE DATABASE users;
CREATE DATABASE auctions;
CREATE DATABASE bidding;
CREATE DATABASE payments;
CREATE DATABASE notifications;

-- Bidding keeps its event store (@ocoda/event-sourcing) in its own schema, next
-- to the Prisma-managed read models in `public`.
\connect bidding
CREATE SCHEMA eventstore;
