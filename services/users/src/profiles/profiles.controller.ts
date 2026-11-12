import { Controller, Get, Param, SerializeOptions } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type PublicProfile, PublicProfileSchema, UserIdSchema } from './profiles.schemas.js';
import { ProfilesService } from './profiles.service.js';

@ApiTags('users')
@Controller('users')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  /**
   * A user's public profile. Right after registering it can take a moment to
   * appear: the profile is created when the auth service's event arrives.
   */
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
