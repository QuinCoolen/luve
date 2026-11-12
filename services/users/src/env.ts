import { z } from 'zod';

/** The users service's environment, checked once at startup (see .env.example). */
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
