import { z } from 'zod';

/** The users service's environment, checked once at startup (see .env.example). */
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),

  // Access tokens are issued by the auth service; this is where its public keys are.
  AUTH_JWKS_URL: z.url(),
  JWT_ISSUER: z.string().min(1).default('luve-auth'),
  JWT_AUDIENCE: z.string().min(1).default('luve'),
});

export type Env = z.infer<typeof envSchema>;
