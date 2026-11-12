import { z } from 'zod';

/** Lowercased so `Alice@Luve.dev` and `alice@luve.dev` are one account. */
export const EmailSchema = z
  .email({ error: 'Enter a valid email address.' })
  .max(254)
  .transform((email) => email.toLowerCase());

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

/** The account you just registered or logged in to. Your profile is at GET /users/me. */
export const AccountSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
  })
  .meta({ id: 'Account' });
export type Account = z.infer<typeof AccountSchema>;
