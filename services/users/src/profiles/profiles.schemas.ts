import { z } from 'zod';

export const UsernameSchema = z
  .string()
  .min(3, { error: 'Username must be at least 3 characters.' })
  .max(30, { error: 'Username must be at most 30 characters.' })
  .regex(/^[a-zA-Z0-9_]+$/, { error: 'Use only letters, numbers and underscores.' });

/** Your own profile. `username` is null until you've chosen one. */
export const MeSchema = z
  .object({
    id: z.uuid(),
    username: z.string().nullable(),
  })
  .meta({ id: 'Me' });
export type Me = z.infer<typeof MeSchema>;

export const UpdateMeRequestSchema = z
  .object({
    username: UsernameSchema,
  })
  .meta({ id: 'UpdateMeRequest' });
export type UpdateMeRequest = z.infer<typeof UpdateMeRequestSchema>;

/** What anyone may see about a user. */
export const PublicProfileSchema = z
  .object({
    id: z.uuid(),
    username: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .meta({ id: 'PublicProfile' });
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const UserIdSchema = z.uuid({ error: 'Not a valid user id.' });
