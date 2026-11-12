import { z } from 'zod';
import { defineEvent } from './envelope.js';

/**
 * Events published by the auth service. Other services keep the bits of
 * user data they need (a seller's username, an email address for
 * notifications) from these, instead of calling auth.
 */

export const UserRegisteredV1 = defineEvent(
  'auth.user-registered.v1',
  z.object({
    userId: z.uuid(),
    email: z.email(),
    username: z.string(),
    registeredAt: z.iso.datetime({ offset: true }),
  }),
);

export const UserUpdatedV1 = defineEvent(
  'auth.user-updated.v1',
  z.object({
    userId: z.uuid(),
    email: z.email(),
    username: z.string(),
  }),
);

export const UserDeletedV1 = defineEvent(
  'auth.user-deleted.v1',
  z.object({
    userId: z.uuid(),
  }),
);

export const authEvents = [UserRegisteredV1, UserUpdatedV1, UserDeletedV1] as const;
