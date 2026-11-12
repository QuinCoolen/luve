import { describe, expect, it } from 'vitest';
import { PasswordSchema, RegisterRequestSchema, UsernameSchema } from './auth.schemas.js';

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

describe('username', () => {
  it.each(['bob', 'alice_99', 'A'.repeat(30)])('accepts %j', (username) => {
    expect(UsernameSchema.safeParse(username).success).toBe(true);
  });

  it.each(['ab', 'has space', 'émile', 'a'.repeat(31), 'dash-ed'])('rejects %j', (username) => {
    expect(UsernameSchema.safeParse(username).success).toBe(false);
  });
});

describe('register request', () => {
  it('lowercases the email', () => {
    const parsed = RegisterRequestSchema.parse({
      email: 'Alice@Luve.DEV',
      username: 'alice',
      password: 'Password1',
    });
    expect(parsed.email).toBe('alice@luve.dev');
  });
});
