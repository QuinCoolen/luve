import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AuthEventsConsumer } from './auth-events.consumer.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, AuthEventsConsumer, JwtAuthGuard],
})
export class ProfilesModule {}
