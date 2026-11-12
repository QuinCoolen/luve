import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v7 as uuidv7 } from 'uuid';
import type { Env } from '../env.js';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service.js';

export interface ClientInfo {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

export function invalidRefreshToken(): UnauthorizedException {
  return new UnauthorizedException('Invalid refresh token. Log in again.');
}

/** Two tabs refreshed at once: retry with the cookies the other request set. */
function refreshTokenStale(): ConflictException {
  return new ConflictException(
    'This session was refreshed a moment ago. Retry with the current cookies.',
  );
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Refresh-token sessions with rotation and reuse detection.
 *
 * - Every login starts a new session *family*.
 * - Every refresh revokes the presented token and issues a new one in the
 *   same family (rotation), so a token works exactly once.
 * - A revoked token presented again means it was copied: the whole family is
 *   revoked, logging out both the thief and the victim. The exception is a
 *   token rotated moments ago (two tabs refreshing at once), which only gets
 *   a 409 "retry" answer.
 */
@Injectable()
export class Sessions {
  private readonly logger = new Logger(Sessions.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get ttlMs(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 24 * 60 * 60 * 1000;
  }

  private get reuseGraceMs(): number {
    return this.config.get('REFRESH_REUSE_GRACE_SECONDS', { infer: true }) * 1000;
  }

  /** Starts a new session family for `userId` inside `tx`. */
  async start(tx: PrismaTx, userId: string, client: ClientInfo): Promise<IssuedRefreshToken> {
    return this.insert(tx, userId, uuidv7(), client);
  }

  /** Exchanges a refresh token for a new one. Resolves the user it belongs to. */
  async rotate(
    token: string,
    client: ClientInfo,
  ): Promise<{ refresh: IssuedRefreshToken; user: { id: string; username: string } }> {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashToken(token) },
      include: { user: { select: { id: true, username: true } } },
    });
    if (!session) {
      throw invalidRefreshToken();
    }

    const now = Date.now();
    if (session.revokedAt) {
      const rotatedRecently =
        session.replacedById !== null && now - session.revokedAt.getTime() < this.reuseGraceMs;
      if (rotatedRecently) {
        throw refreshTokenStale();
      }
      await this.revokeFamily(session.familyId);
      this.logger.warn(
        `Revoked refresh token reused by user ${session.userId}: ended session family ${session.familyId}`,
      );
      throw new UnauthorizedException(
        'This refresh token was already used, so the session was ended for your safety. Log in again.',
      );
    }
    if (session.expiresAt.getTime() <= now) {
      throw invalidRefreshToken();
    }

    const refresh = await this.prisma.$transaction(async (tx) => {
      const next = await this.insert(tx, session.userId, session.familyId, client);
      // Conditional update: if a concurrent request rotated this token first,
      // nothing matches and this rotation rolls back.
      const { count } = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date(now), replacedById: next.sessionId },
      });
      if (count === 0) {
        throw refreshTokenStale();
      }
      return next;
    });

    return { refresh: { token: refresh.token, expiresAt: refresh.expiresAt }, user: session.user };
  }

  /** Ends the session the token belongs to (logout). Unknown tokens are ignored. */
  async revoke(token: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async insert(
    tx: PrismaTx,
    userId: string,
    familyId: string,
    client: ClientInfo,
  ): Promise<IssuedRefreshToken & { sessionId: string }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const session = await tx.session.create({
      data: {
        userId,
        familyId,
        refreshTokenHash: hashToken(token),
        userAgent: client.userAgent?.slice(0, 512) ?? null,
        ip: client.ip ?? null,
        expiresAt,
      },
      select: { id: true },
    });
    return { token, expiresAt, sessionId: session.id };
  }
}
