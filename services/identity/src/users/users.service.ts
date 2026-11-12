import { UserDeletedV1, UserUpdatedV1 } from '@luve/contracts';
import { IntegrationEvents } from '@luve/messaging';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService, type UserRecord } from '../auth/auth.service.js';
import { withUniqueGuard } from '../auth/unique-guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateProfileRequest } from './users.schemas.js';

const USER_FIELDS = { id: true, email: true, username: true, createdAt: true } as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly events: IntegrationEvents,
  ) {}

  async findPublic(id: string): Promise<{ id: string; username: string; createdAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException('No user with this id.');
    }
    return user;
  }

  /** Updates the profile and publishes `user-updated` in the same transaction. */
  async update(userId: string, changes: UpdateProfileRequest): Promise<UserRecord> {
    await this.auth.me(userId);
    await this.auth.assertAvailable(changes, userId);

    const user = await withUniqueGuard(() =>
      this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            ...(changes.email !== undefined ? { email: changes.email } : {}),
            ...(changes.username !== undefined ? { username: changes.username } : {}),
          },
          select: USER_FIELDS,
        });
        await this.events.stage(
          tx,
          UserUpdatedV1,
          { userId: updated.id, email: updated.email, username: updated.username },
          { key: updated.id },
        );
        return updated;
      }),
    );
    this.events.flush();
    return user;
  }

  /** Deletes the account (its sessions cascade) and publishes `user-deleted`. */
  async delete(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.deleteMany({ where: { id: userId } });
      if (count === 0) {
        return;
      }
      await this.events.stage(tx, UserDeletedV1, { userId }, { key: userId });
    });
    this.events.flush();
  }
}
