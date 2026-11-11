import { z } from 'zod';

/**
 * Environment every service needs. Services extend it with their own variables:
 *
 * ```ts
 * export const envSchema = baseEnvSchema.extend({ DATABASE_URL: z.string().min(1) });
 * export type Env = z.infer<typeof envSchema>;
 * ```
 */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Parses the raw environment against `schema`. Unknown keys are ignored; every
 * problem is reported at once in a readable message, so a misconfigured
 * service fails before Nest finishes booting.
 */
export function parseEnv<S extends z.ZodType>(
  schema: S,
  config: Record<string, unknown>,
): z.infer<S> {
  const result = schema.safeParse(config);
  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment variables:\n${details}\n\nSee this service's .env.example for the full list.`,
  );
}
