import { UserDeletedV1, UserRegisteredV1 } from '@luve/contracts';
import { IntegrationEvents } from '@luve/messaging';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokens } from '../keys/access-tokens.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Account, LoginRequest, RegisterRequest } from './auth.schemas.js';
import { Passwords } from './passwords.js';
import { type ClientInfo, type IssuedRefreshToken, Sessions } from './sessions.js';

export interface SignedIn {
  account: Account;
  accessToken: string;
  refresh: IssuedRefreshToken;
}

/** Same `field: message` form as validation errors, so the form shows it under the email input. */
function emailTaken(): ConflictException {
  return new ConflictException(['email: This email is already registered.']);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: Passwords,
    private readonly sessions: Sessions,
    private readonly accessTokens: AccessTokens,
    private readonly events: IntegrationEvents,
  ) {}

  /**
   * Creates the account, its first session and the `user-registered` event in
   * one transaction: either all three exist afterwards or none do. The users
   * service creates the (still empty) profile when the event arrives.
   */
  async register(input: RegisterRequest, client: ClientInfo): Promise<SignedIn> {
    // Friendly check first. The unique index is the real guarantee: a
    // registration racing this one fails on insert (P2002), caught below.
    if (await this.prisma.user.findUnique({ where: { email: input.email } })) {
      throw emailTaken();
    }
    const passwordHash = await this.passwords.hash(input.password);

    const { user, refresh } = await this.prisma
      .$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: input.email, passwordHash },
          select: { id: true, email: true, createdAt: true },
        });
        const refresh = await this.sessions.start(tx, user.id, client);
        await this.events.stage(
          tx,
          UserRegisteredV1,
          { userId: user.id, email: user.email, registeredAt: user.createdAt.toISOString() },
          { key: user.id },
        );
        return { user, refresh };
      })
      .catch((error: unknown) => {
        throw (error as { code?: unknown } | null)?.code === 'P2002' ? emailTaken() : error;
      });
    this.events.flush();

    return {
      account: { id: user.id, email: user.email },
      refresh,
      accessToken: await this.accessTokens.issue(user.id),
    };
  }

  async login(input: LoginRequest, client: ClientInfo): Promise<SignedIn> {
    const found = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!(await this.passwords.verify(found?.passwordHash, input.password)) || !found) {
      throw new UnauthorizedException('The email or password is incorrect.');
    }

    const refresh = await this.prisma.$transaction((tx) =>
      this.sessions.start(tx, found.id, client),
    );
    return {
      account: { id: found.id, email: found.email },
      refresh,
      accessToken: await this.accessTokens.issue(found.id),
    };
  }

  async refresh(
    refreshToken: string,
    client: ClientInfo,
  ): Promise<{ accessToken: string; refresh: IssuedRefreshToken }> {
    const { refresh, userId } = await this.sessions.rotate(refreshToken, client);
    return { refresh, accessToken: await this.accessTokens.issue(userId) };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.sessions.revoke(refreshToken);
    }
  }

  /** Deletes the account (its sessions cascade) and publishes `user-deleted`. */
  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.deleteMany({ where: { id: userId } });
      if (count > 0) {
        await this.events.stage(tx, UserDeletedV1, { userId }, { key: userId });
      }
    });
    this.events.flush();
  }
}
