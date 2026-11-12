import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthCookies } from '../auth/auth-cookies.js';
import { type Me, MeSchema, toMe } from '../auth/auth.schemas.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AccessTokens, type TokenUser } from '../keys/access-tokens.js';
import { type UpdateAccountRequest, UpdateAccountRequestSchema } from './account.schemas.js';
import { AccountService } from './account.service.js';

/** The signed-in user's own account. Every route needs a valid access token. */
@ApiTags('account')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Not signed in, or the access token expired' })
@UseGuards(JwtAuthGuard)
@Controller('auth/me')
export class AccountController {
  constructor(
    private readonly auth: AuthService,
    private readonly account: AccountService,
    private readonly cookies: AuthCookies,
    private readonly accessTokens: AccessTokens,
  ) {}

  @Get()
  @SerializeOptions({ schema: MeSchema })
  @ApiOkResponse({ description: 'The signed-in user', standardSchema: MeSchema })
  async me(@CurrentUser() user: TokenUser): Promise<Me> {
    return toMe(await this.auth.me(user.id));
  }

  /** Changes your email and/or username. Re-issues the access cookie, which carries the username. */
  @Patch()
  @SerializeOptions({ schema: MeSchema })
  @ApiOkResponse({ description: 'Account updated', standardSchema: MeSchema })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email or username already taken' })
  async updateMe(
    @CurrentUser() caller: TokenUser,
    @Body({ schema: UpdateAccountRequestSchema }) body: UpdateAccountRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Me> {
    const user = await this.account.update(caller.id, body);
    const accessToken = await this.accessTokens.issue(user);
    this.cookies.setAccessToken(res, accessToken, this.accessTokens.ttlSeconds);
    return toMe(user);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Account deleted and signed out' })
  async deleteMe(
    @CurrentUser() caller: TokenUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.account.delete(caller.id);
    this.cookies.clear(res);
  }
}
