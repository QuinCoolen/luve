import { z } from 'zod';
import { defineEvent } from './envelope.js';

/**
 * Events published by the auth service: an account was created or deleted.
 * Profile data (username, picture, …) belongs to the users service, not here.
 */

export const UserRegisteredV1 = defineEvent(
  'auth.user-registered.v1',
  z.object({
    userId: z.uuid(),
    email: z.email(),
    registeredAt: z.iso.datetime({ offset: true }),
  }),
);

export const UserDeletedV1 = defineEvent(
  'auth.user-deleted.v1',
  z.object({
    userId: z.uuid(),
  }),
);

export const authEvents = [UserRegisteredV1, UserDeletedV1] as const;
