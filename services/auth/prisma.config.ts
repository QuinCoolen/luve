import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (migrate, generate). The CLI reads DATABASE_URL
 * from .env; at runtime the client connects through the pg driver adapter in
 * src/prisma/prisma.service.ts. `prisma generate` doesn't need a database, so
 * an empty URL is fine there (CI, Docker builds).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
