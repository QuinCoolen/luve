import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration. The CLI (migrate/db) reads the datasource URL from
 * here (Prisma 7 no longer auto-loads .env, hence `import 'dotenv/config'`).
 * At runtime the PrismaClient connects via the pg driver adapter — see
 * src/prisma/prisma.service.ts.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
