import { describe, expect, it } from 'vitest';
import { UsernameSchema } from './profiles.schemas.js';

describe('username', () => {
  it.each(['bob', 'alice_99', 'A'.repeat(30)])('accepts %j', (username) => {
    expect(UsernameSchema.safeParse(username).success).toBe(true);
  });

  it.each(['ab', 'has space', 'émile', 'a'.repeat(31), 'dash-ed'])('rejects %j', (username) => {
    expect(UsernameSchema.safeParse(username).success).toBe(false);
  });
});
