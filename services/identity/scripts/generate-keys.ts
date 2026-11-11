// Generates an Ed25519 signing key for access tokens and writes it to
// services/identity/.env as JWT_PRIVATE_KEY (base64 PKCS#8 PEM) + JWT_KEY_ID.
// Run: pnpm --filter @luve/identity keys:generate
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const envFile = new URL('../.env', import.meta.url);
const { privateKey } = generateKeyPairSync('ed25519');
const pem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
const values: Record<string, string> = {
  JWT_PRIVATE_KEY: Buffer.from(pem).toString('base64'),
  JWT_KEY_ID: `dev-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`,
};

let env = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
for (const [key, value] of Object.entries(values)) {
  const line = `${key}=${value}`;
  // Replaces an existing (or commented-out) line for the key, else appends one.
  const pattern = new RegExp(String.raw`^#?\s*${key}=.*$`, 'm');
  env = pattern.test(env) ? env.replace(pattern, line) : `${env.trimEnd()}\n${line}\n`;
}
writeFileSync(envFile, env);
console.log(`Wrote a new Ed25519 signing key (${values['JWT_KEY_ID']}) to services/identity/.env`);
