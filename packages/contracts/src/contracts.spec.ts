import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authEvents, UserRegisteredV1 } from './index.js';

const contracts = [...authEvents];
const fixturesDir = new URL('../fixtures/', import.meta.url);

/**
 * Every fixture is a real-looking message of one event type. Consumers can use
 * the same files in their tests, so producer and consumer agree on the shape.
 */
describe('event contracts', () => {
  const fixtures = readdirSync(fixturesDir).filter((file) => file.endsWith('.json'));

  it('has a fixture for every contract', () => {
    expect(fixtures.map((file) => file.replace(/\.json$/, '')).sort()).toEqual(
      contracts.map((contract) => contract.type).sort(),
    );
  });

  for (const file of fixtures) {
    it(`accepts fixtures/${file}`, () => {
      const message = JSON.parse(readFileSync(new URL(file, fixturesDir), 'utf8'));
      const contract = contracts.find((candidate) => candidate.type === message.type);
      expect(contract, `no contract for ${message.type}`).toBeDefined();
      expect(contract!.envelope.safeParse(message).success).toBe(true);
    });
  }

  it('rejects an envelope of the wrong type', () => {
    const message = JSON.parse(
      readFileSync(new URL('auth.user-deleted.v1.json', fixturesDir), 'utf8'),
    );
    expect(UserRegisteredV1.envelope.safeParse(message).success).toBe(false);
  });

  it('rejects data that breaks the contract', () => {
    const message = JSON.parse(
      readFileSync(new URL('auth.user-registered.v1.json', fixturesDir), 'utf8'),
    );
    message.data.email = 'not-an-email';
    expect(UserRegisteredV1.envelope.safeParse(message).success).toBe(false);
  });
});
