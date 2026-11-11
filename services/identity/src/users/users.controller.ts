import { ApiProblem, Auth, type AuthUser, CurrentUser, RequestId } from '@luve/service-kit';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Res,
  SerializeOptions,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthCookies } from '../auth/auth-cookies.js';
import { type Me, MeSchema, toMe } from '../auth/auth.schemas.js';
import { AccessTokens } from '../keys/access-tokens.js';
import {
  type PublicProfile,
  PublicProfileSchema,
  type UpdateProfileRequest,
  UpdateProfileRequestSchema,
  UserIdSchema,
} from './users.schemas.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly cookies: AuthCookies,
    private readonly accessTokens: AccessTokens,
  ) {}

  /** Changes your email and/or username. Re-issues the access cookie, which carries the username. */
  @Patch('me')
  @Auth()
  @SerializeOptions({ schema: MeSchema })
  @ApiOkResponse({ description: 'Profile updated', standardSchema: MeSchema })
  @ApiProblem(400, 'Validation failed')
  @ApiProblem(409, 'Email or username already taken')
  async updateMe(
    @CurrentUser() caller: AuthUser,
    @Body({ schema: UpdateProfileRequestSchema }) body: UpdateProfileRequest,
    @Res({ passthrough: true }) res: Response,
    @RequestId() requestId: string,
  ): Promise<Me> {
    const user = await this.users.update(caller.id, body, requestId);
    const accessToken = await this.accessTokens.issue(user);
    this.cookies.setAccessToken(res, accessToken, this.accessTokens.ttlSeconds);
    return toMe(user);
  }

  @Delete('me')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Account deleted and signed out' })
  async deleteMe(
    @CurrentUser() caller: AuthUser,
    @Res({ passthrough: true }) res: Response,
    @RequestId() requestId: string,
  ): Promise<void> {
    await this.users.delete(caller.id, requestId);
    this.cookies.clear(res);
  }

  @Get(':id')
  @SerializeOptions({ schema: PublicProfileSchema })
  @ApiOkResponse({ description: 'Public profile', standardSchema: PublicProfileSchema })
  @ApiProblem(404, 'No such user')
  async getProfile(@Param('id', { schema: UserIdSchema }) id: string): Promise<PublicProfile> {
    const user = await this.users.findPublic(id);
    return { id: user.id, username: user.username, createdAt: user.createdAt.toISOString() };
  }
}
