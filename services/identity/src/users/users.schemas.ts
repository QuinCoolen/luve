import { z } from 'zod';
import { EmailSchema, UsernameSchema } from '../auth/auth.schemas.js';

/** What anyone may see about a user. */
export const PublicProfileSchema = z
  .object({
    id: z.uuid(),
    username: z.string(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .meta({ id: 'PublicProfile' });
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const UpdateProfileRequestSchema = z
  .object({
    email: EmailSchema.optional(),
    username: UsernameSchema.optional(),
  })
  .refine((body) => body.email !== undefined || body.username !== undefined, {
    error: 'Change at least one field.',
  })
  .meta({ id: 'UpdateProfileRequest' });
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const UserIdSchema = z.uuid({ error: 'Not a valid user id.' });
