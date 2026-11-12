import { Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Profiles are a copy of what the auth service knows. Each write below is safe
 * to run twice, because RabbitMQ may deliver the same event more than once.
 */
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

  /** Creates the profile; a second delivery finds it already there and changes nothing. */
  async create(userId: string, username: string, createdAt: Date): Promise<void> {
    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, username, createdAt },
      update: {},
    });
  }

  async rename(userId: string, username: string): Promise<void> {
    await this.prisma.profile.updateMany({ where: { userId }, data: { username } });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.profile.deleteMany({ where: { userId } });
  }
}
