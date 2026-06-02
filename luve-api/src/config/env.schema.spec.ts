import { validateEnv } from './env.schema';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db?schema=public',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'x'.repeat(32),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '30d',
  CORS_ORIGIN: 'http://localhost:3000',
  COOKIE_DOMAIN: 'localhost',
};

describe('validateEnv', () => {
  it('accepts a valid env and applies defaults', () => {
    const env = validateEnv({ ...base });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(5218);
  });

  it('coerces PORT to a number', () => {
    const env = validateEnv({ ...base, PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('throws a readable error when a required var is missing', () => {
    const incomplete: Record<string, unknown> = { ...base };
    delete incomplete.DATABASE_URL;
    expect(() => validateEnv(incomplete)).toThrow(
      /Invalid environment variables/,
    );
  });

  it('throws when JWT_SECRET is too short', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow();
  });
});
