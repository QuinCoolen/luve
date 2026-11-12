import { Module } from '@nestjs/common';
import { KeysModule } from '../keys/keys.module.js';
import { AuthCookies } from './auth-cookies.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Passwords } from './passwords.js';
import { Sessions } from './sessions.js';

@Module({
  imports: [KeysModule],
  controllers: [AuthController],
  providers: [AuthService, AuthCookies, Passwords, Sessions, JwtAuthGuard],
  exports: [AuthService, AuthCookies, JwtAuthGuard],
})
export class AuthModule {}
