// Copies every `.env.example` in apps/ and services/ to `.env` when no `.env`
// exists yet, so `pnpm dev` works on a fresh clone. Never overwrites.
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

for (const group of ['apps', 'services']) {
  const groupDir = join(root, group);
  if (!existsSync(groupDir)) continue;
  for (const name of readdirSync(groupDir)) {
    const example = join(groupDir, name, '.env.example');
    const target = join(groupDir, name, '.env');
    if (!existsSync(example)) continue;
    if (existsSync(target)) {
      console.log(`skip    ${group}/${name}/.env (exists)`);
      continue;
    }
    copyFileSync(example, target);
    console.log(`created ${group}/${name}/.env`);
  }
}
