import { z } from 'zod';

/** What anyone may see about a user. */
export const PublicProfileSchema = z
  .object({
    id: z.uuid(),
    username: z.string(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .meta({ id: 'PublicProfile' });
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const UserIdSchema = z.uuid({ error: 'Not a valid user id.' });
