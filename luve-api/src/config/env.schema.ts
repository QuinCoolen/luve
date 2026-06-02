import { z } from 'zod';

/**
 * Single source of truth for the service's environment.
 *
 * Validated at boot by `ConfigModule` (see config.module.ts). A missing or
 * malformed variable throws a readable error before Nest finishes starting,
 * so the process never comes up half-configured.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5218),

  // Postgres connection string, e.g. postgresql://user:pass@host:5432/db?schema=public
  DATABASE_URL: z.string().min(1),

  // Redis connection string, e.g. redis://localhost:6379
  REDIS_URL: z.string().min(1),

  // Auth — JWT signing secret and token lifetimes (e.g. "15m", "30d").
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().min(1),
  JWT_REFRESH_TTL: z.string().min(1),

  // CORS allow-list origin for the browser app and the cookie domain.
  CORS_ORIGIN: z.string().min(1),
  COOKIE_DOMAIN: z.string().min(1),

  // Stripe — optional in dev so the app boots without payment config.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * `ConfigModule.forRoot({ validate })` hands us the raw merged env. We parse the
 * subset we care about (unknown keys are ignored) and surface every problem at
 * once with a human-readable message.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.') || '(root)';
        return `  • ${path}: ${issue.message}`;
      })
      .join('\n');
    throw new Error(
      `Invalid environment variables:\n${details}\n\nSee luve-api/.env.example for the full list.`,
    );
  }

  return result.data;
}
