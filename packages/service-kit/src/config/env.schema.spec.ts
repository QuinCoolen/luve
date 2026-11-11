import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { baseEnvSchema, parseEnv } from './env.schema.js';

const schema = baseEnvSchema.extend({
  DATABASE_URL: z.string().min(1),
});

const base = {
  PORT: '4001',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
};

describe('parseEnv', () => {
  it('accepts a valid env and applies defaults', () => {
    const env = parseEnv(schema, { ...base });
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBeUndefined();
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv(schema, { ...base }).PORT).toBe(4001);
  });

  it('ignores unknown variables', () => {
    const env = parseEnv(schema, { ...base, PATH: '/usr/bin' });
    expect(env).not.toHaveProperty('PATH');
  });

  it('throws a readable error listing every missing variable', () => {
    expect(() => parseEnv(schema, {})).toThrow(
      /Invalid environment variables[\s\S]*PORT[\s\S]*DATABASE_URL/,
    );
  });
});
