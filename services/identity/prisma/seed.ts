import { PrismaPg } from '@prisma/adapter-pg';
import { AuctionStatus, PrismaClient } from '../src/generated/prisma/client';

/**
 * Seeds one test user and one active auction. Idempotent — safe to run repeatedly.
 *
 * NOTE: `passwordHash` is a placeholder; real argon2 hashing arrives with auth
 * in Phase 2. Don't log in with this user.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL ?? ''),
});

async function main(): Promise<void> {
  const seller = await prisma.user.upsert({
    where: { email: 'test@luve.dev' },
    update: {},
    create: {
      email: 'test@luve.dev',
      username: 'test-seller',
      passwordHash: 'seed-placeholder-not-a-real-hash',
    },
  });

  const existing = await prisma.auction.findFirst({
    where: { sellerId: seller.id, title: 'Vintage Film Camera' },
  });

  if (!existing) {
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days
    await prisma.auction.create({
      data: {
        title: 'Vintage Film Camera',
        description: 'A well-loved 35mm rangefinder. Seed data.',
        startingPrice: 100,
        currentPrice: 100,
        increment: 5,
        status: AuctionStatus.ACTIVE,
        imageUrl: 'https://placehold.co/600x400?text=Camera',
        endDate,
        sellerId: seller.id,
      },
    });
  }

  console.log(`Seeded user ${seller.email} and one active auction.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
