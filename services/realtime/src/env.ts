import { baseEnvSchema } from '@luve/service-kit';
import type { z } from 'zod';

export const envSchema = baseEnvSchema;

export type Env = z.infer<typeof envSchema>;
