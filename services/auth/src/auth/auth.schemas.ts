import { z } from 'zod';

/** Lowercased so `Alice@Luve.dev` and `alice@luve.dev` are one account. */
export const EmailSchema = z
  .email({ error: 'Enter a valid email address.' })
  .max(254)
  .transform((email) => email.toLowerCase());

export const UsernameSchema = z
  .string()
  .min(3, { error: 'Username must be at least 3 characters.' })
  .max(30, { error: 'Username must be at most 30 characters.' })
  .regex(/^[a-zA-Z0-9_]+$/, { error: 'Use only letters, numbers and underscores.' });

/**
 * At least 8 characters with a letter and a digit. The 128 cap stops someone
 * from making argon2 hash a megabyte-long "password".
 */
export const PasswordSchema = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters.' })
  .max(128, { error: 'Password must be at most 128 characters.' })
  .regex(/[a-zA-Z]/, { error: 'Password must contain a letter.' })
  .regex(/[0-9]/, { error: 'Password must contain a digit.' });

export const RegisterRequestSchema = z
  .object({
    email: EmailSchema,
    username: UsernameSchema,
    password: PasswordSchema,
  })
  .meta({ id: 'RegisterRequest' });
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z
  .object({
    email: EmailSchema,
    // Not validated against the policy: a wrong password is just "invalid credentials".
    password: z.string().min(1).max(128),
  })
  .meta({ id: 'LoginRequest' });
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** The signed-in user, as returned to themselves. */
export const MeSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    username: z.string(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .meta({ id: 'Me' });
export type Me = z.infer<typeof MeSchema>;

export function toMe(user: { id: string; email: string; username: string; createdAt: Date }): Me {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
  };
}
