import {
  Body,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AccessTokens, type TokenUser } from '../keys/access-tokens.js';
import { AuthCookies, REFRESH_TOKEN_COOKIE } from './auth-cookies.js';
import {
  type Account,
  AccountSchema,
  type LoginRequest,
  LoginRequestSchema,
  type RegisterRequest,
  RegisterRequestSchema,
} from './auth.schemas.js';
import { AuthService, type SignedIn } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { type ClientInfo, invalidRefreshToken } from './sessions.js';

function clientInfo(req: Request): ClientInfo {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

function refreshCookie(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[REFRESH_TOKEN_COOKIE];
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly accessTokens: AccessTokens,
  ) {}

  /** Creates the account and signs in. The username is chosen next, on the users service. */
  @Post('register')
  @SerializeOptions({ schema: AccountSchema })
  @ApiCreatedResponse({
    description: 'Account created and signed in',
    standardSchema: AccountSchema,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(
    @Body({ schema: RegisterRequestSchema }) body: RegisterRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Account> {
    return this.signIn(res, await this.auth.register(body, clientInfo(req)));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ schema: AccountSchema })
  @ApiOkResponse({ description: 'Signed in', standardSchema: AccountSchema })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body({ schema: LoginRequestSchema }) body: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Account> {
    return this.signIn(res, await this.auth.login(body, clientInfo(req)));
  }

  /** Rotates the refresh cookie and issues a new access cookie. */
  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'New access and refresh cookies set' })
  @ApiUnauthorizedResponse({ description: 'Missing, invalid, expired or reused refresh token' })
  @ApiConflictResponse({ description: 'Another request rotated this token a moment ago' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = refreshCookie(req);
    if (!token) {
      this.cookies.clear(res);
      throw invalidRefreshToken();
    }
    try {
      const { accessToken, refresh } = await this.auth.refresh(token, clientInfo(req));
      this.cookies.setAccessToken(res, accessToken, this.accessTokens.ttlSeconds);
      this.cookies.setRefreshToken(res, refresh);
    } catch (error) {
      // A conflict means another request already rotated the token: the
      // browser holds the new cookie, so leave the cookies alone.
      if (!(error instanceof ConflictException)) {
        this.cookies.clear(res);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session ended, cookies cleared' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(refreshCookie(req));
    this.cookies.clear(res);
  }

  /** Deletes your account. The users service removes your profile when the event arrives. */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiNoContentResponse({ description: 'Account deleted and signed out' })
  @ApiUnauthorizedResponse({ description: 'Not signed in, or the access token expired' })
  async deleteMe(
    @CurrentUser() user: TokenUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.deleteAccount(user.id);
    this.cookies.clear(res);
  }

  private signIn(res: Response, signedIn: SignedIn): Account {
    this.cookies.setAccessToken(res, signedIn.accessToken, this.accessTokens.ttlSeconds);
    this.cookies.setRefreshToken(res, signedIn.refresh);
    return signedIn.account;
  }
}
