import { UserRegisteredV1 } from '@luve/contracts';
import { IntegrationEvents } from '@luve/messaging';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokens } from '../keys/access-tokens.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginRequest, RegisterRequest } from './auth.schemas.js';
import { Passwords } from './passwords.js';
import { withUniqueGuard } from './unique-guard.js';
import { type ClientInfo, type IssuedRefreshToken, Sessions } from './sessions.js';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface SignedIn {
  user: UserRecord;
  accessToken: string;
  refresh: IssuedRefreshToken;
}

const USER_FIELDS = { id: true, email: true, username: true, createdAt: true } as const;

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
   * one transaction: either all three exist afterwards or none do.
   */
  async register(input: RegisterRequest, client: ClientInfo): Promise<SignedIn> {
    await this.assertAvailable(input);
    const passwordHash = await this.passwords.hash(input.password);

    const { user, refresh } = await withUniqueGuard(() =>
      this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: input.email, username: input.username, passwordHash },
          select: USER_FIELDS,
        });
        const refresh = await this.sessions.start(tx, user.id, client);
        await this.events.stage(
          tx,
          UserRegisteredV1,
          {
            userId: user.id,
            email: user.email,
            username: user.username,
            registeredAt: user.createdAt.toISOString(),
          },
          { key: user.id },
        );
        return { user, refresh };
      }),
    );
    this.events.flush();

    return { user, refresh, accessToken: await this.accessTokens.issue(user) };
  }

  async login(input: LoginRequest, client: ClientInfo): Promise<SignedIn> {
    const found = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...USER_FIELDS, passwordHash: true },
    });
    if (!(await this.passwords.verify(found?.passwordHash, input.password)) || !found) {
      throw new UnauthorizedException('The email or password is incorrect.');
    }

    const { passwordHash: _passwordHash, ...user } = found;
    const refresh = await this.prisma.$transaction((tx) =>
      this.sessions.start(tx, user.id, client),
    );
    return { user, refresh, accessToken: await this.accessTokens.issue(user) };
  }

  async refresh(
    refreshToken: string,
    client: ClientInfo,
  ): Promise<{ accessToken: string; refresh: IssuedRefreshToken }> {
    const { refresh, user } = await this.sessions.rotate(refreshToken, client);
    return { refresh, accessToken: await this.accessTokens.issue(user) };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.sessions.revoke(refreshToken);
    }
  }

  async me(userId: string): Promise<UserRecord> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: USER_FIELDS });
    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }
    return user;
  }

  /**
   * Friendly errors for the common case, in the same `field: message` form as
   * validation errors so the web form can show them next to the inputs. The unique indexes are still
   * the real guarantee: a concurrent registration that slips past this check
   * fails on insert, which `withUniqueGuard` turns into the same 409.
   */
  async assertAvailable(
    fields: { email?: string | undefined; username?: string | undefined },
    exceptUserId?: string,
  ): Promise<void> {
    const or = [
      ...(fields.email ? [{ email: fields.email }] : []),
      ...(fields.username ? [{ username: fields.username }] : []),
    ];
    if (or.length === 0) return;

    const clashes = await this.prisma.user.findMany({
      where: { OR: or, ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}) },
      select: { email: true, username: true },
    });
    const taken: string[] = [];
    if (fields.email && clashes.some((user) => user.email === fields.email)) {
      taken.push('email: This email is already registered.');
    }
    if (fields.username && clashes.some((user) => user.username === fields.username)) {
      taken.push('username: This username is taken.');
    }
    if (taken.length > 0) {
      throw new ConflictException(taken);
    }
  }
}
