import { z } from 'zod';
import { EmailSchema, UsernameSchema } from '../auth/auth.schemas.js';

export const UpdateAccountRequestSchema = z
  .object({
    email: EmailSchema.optional(),
    username: UsernameSchema.optional(),
  })
  .refine((body) => body.email !== undefined || body.username !== undefined, {
    error: 'Change at least one field.',
  })
  .meta({ id: 'UpdateAccountRequest' });
export type UpdateAccountRequest = z.infer<typeof UpdateAccountRequestSchema>;
