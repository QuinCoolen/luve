import { baseEnvSchema } from '@luve/service-kit';
import { z } from 'zod';

export const envSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  OUTBOX_RELAY: z.enum(['on', 'off']).default('on'),

  JWT_PRIVATE_KEY: z.string().min(1).optional(),
  JWT_KEY_ID: z.string().min(1).default('dev'),
  JWT_ISSUER: z.string().min(1).default('luve-identity'),
  JWT_AUDIENCE: z.string().min(1).default('luve'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_REUSE_GRACE_SECONDS: z.coerce.number().int().nonnegative().default(10),

  COOKIE_SECURE: z.stringbool().default(false),
});

export type Env = z.infer<typeof envSchema>;
