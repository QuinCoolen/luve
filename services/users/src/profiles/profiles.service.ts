import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Me } from './profiles.schemas.js';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('No user with this id.');
    }
    return profile;
  }

  async findMine(userId: string): Promise<Me> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    return { id: userId, username: profile?.username ?? null };
  }

  /**
   * Sets your username. If auth's user-registered event hasn't arrived yet,
   * this creates the profile; the event then only adds the registration date.
   */
  async setUsername(userId: string, username: string): Promise<Me> {
    try {
      const profile = await this.prisma.profile.upsert({
        where: { userId },
        create: { userId, username, createdAt: new Date() },
        update: { username },
      });
      return { id: profile.userId, username: profile.username };
    } catch (error) {
      // The unique index on username is what guarantees no two users share one.
      if ((error as { code?: unknown } | null)?.code === 'P2002') {
        throw new ConflictException(['username: This username is taken.']);
      }
      throw error;
    }
  }

  // The two methods below run when auth's events arrive. RabbitMQ may deliver
  // the same event twice, so both are safe to run again.

  /** Creates the empty profile, or (if the user was quicker) records when they registered. */
  async created(userId: string, registeredAt: Date): Promise<void> {
    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, createdAt: registeredAt },
      update: { createdAt: registeredAt },
    });
  }

  async deleted(userId: string): Promise<void> {
    await this.prisma.profile.deleteMany({ where: { userId } });
  }
}
