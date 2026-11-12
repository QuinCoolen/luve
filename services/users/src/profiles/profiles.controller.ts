import { Body, Controller, Get, Param, Patch, SerializeOptions, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard, type TokenUser } from '../auth/jwt-auth.guard.js';
import {
  type Me,
  MeSchema,
  type PublicProfile,
  PublicProfileSchema,
  type UpdateMeRequest,
  UpdateMeRequestSchema,
  UserIdSchema,
} from './profiles.schemas.js';
import { ProfilesService } from './profiles.service.js';

@ApiTags('users')
@Controller('users')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  // The `me` routes come before `:id`, otherwise Nest would treat "me" as an id.

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SerializeOptions({ schema: MeSchema })
  @ApiCookieAuth()
  @ApiOkResponse({ description: 'Your profile', standardSchema: MeSchema })
  @ApiUnauthorizedResponse({ description: 'Not signed in, or the access token expired' })
  async me(@CurrentUser() user: TokenUser): Promise<Me> {
    return this.profiles.findMine(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @SerializeOptions({ schema: MeSchema })
  @ApiCookieAuth()
  @ApiOkResponse({ description: 'Profile updated', standardSchema: MeSchema })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Username already taken' })
  @ApiUnauthorizedResponse({ description: 'Not signed in, or the access token expired' })
  async updateMe(
    @CurrentUser() user: TokenUser,
    @Body({ schema: UpdateMeRequestSchema }) body: UpdateMeRequest,
  ): Promise<Me> {
    return this.profiles.setUsername(user.id, body.username);
  }

  /** Anyone's public profile. */
  @Get(':id')
  @SerializeOptions({ schema: PublicProfileSchema })
  @ApiOkResponse({ description: 'Public profile', standardSchema: PublicProfileSchema })
  @ApiBadRequestResponse({ description: 'Not a valid user id' })
  @ApiNotFoundResponse({ description: 'No such user' })
  async getProfile(@Param('id', { schema: UserIdSchema }) id: string): Promise<PublicProfile> {
    const profile = await this.profiles.find(id);
    return {
      id: profile.userId,
      username: profile.username,
      createdAt: profile.createdAt.toISOString(),
    };
  }
}
