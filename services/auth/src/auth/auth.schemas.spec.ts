import { describe, expect, it } from 'vitest';
import { PasswordSchema, RegisterRequestSchema } from './auth.schemas.js';

describe('password policy', () => {
  it.each(['Password1', 'correct horse 9', 'a1b2c3d4'])('accepts %j', (password) => {
    expect(PasswordSchema.safeParse(password).success).toBe(true);
  });

  it.each([
    ['too short', 'Pass1'],
    ['no digit', 'Password'],
    ['no letter', '12345678'],
    ['too long', `a1${'x'.repeat(127)}`],
  ])('rejects a password that is %s', (_reason, password) => {
    expect(PasswordSchema.safeParse(password).success).toBe(false);
  });
});

describe('register request', () => {
  it('lowercases the email', () => {
    const parsed = RegisterRequestSchema.parse({
      email: 'Alice@Luve.DEV',
      password: 'Password1',
    });
    expect(parsed.email).toBe('alice@luve.dev');
  });
});
