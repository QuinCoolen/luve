import { Auth, type AuthUser, CurrentUser, REFRESH_TOKEN_COOKIE } from '@luve/service-kit';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AccessTokens } from '../keys/access-tokens.js';
import { AuthCookies } from './auth-cookies.js';
import {
  type LoginRequest,
  LoginRequestSchema,
  type Me,
  MeSchema,
  type RegisterRequest,
  RegisterRequestSchema,
  toMe,
} from './auth.schemas.js';
import { AuthService, type SignedIn } from './auth.service.js';
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

  @Post('register')
  @SerializeOptions({ schema: MeSchema })
  @ApiCreatedResponse({ description: 'Account created and signed in', standardSchema: MeSchema })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email or username already taken' })
  async register(
    @Body({ schema: RegisterRequestSchema }) body: RegisterRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Me> {
    const signedIn = await this.auth.register(body, clientInfo(req));
    return this.signIn(res, signedIn);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ schema: MeSchema })
  @ApiOkResponse({ description: 'Signed in', standardSchema: MeSchema })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body({ schema: LoginRequestSchema }) body: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Me> {
    const signedIn = await this.auth.login(body, clientInfo(req));
    return this.signIn(res, signedIn);
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

  @Get('me')
  @Auth()
  @SerializeOptions({ schema: MeSchema })
  @ApiOkResponse({ description: 'The signed-in user', standardSchema: MeSchema })
  async me(@CurrentUser() user: AuthUser): Promise<Me> {
    return toMe(await this.auth.me(user.id));
  }

  private signIn(res: Response, signedIn: SignedIn): Me {
    this.cookies.setAccessToken(res, signedIn.accessToken, this.accessTokens.ttlSeconds);
    this.cookies.setRefreshToken(res, signedIn.refresh);
    return toMe(signedIn.user);
  }
}
