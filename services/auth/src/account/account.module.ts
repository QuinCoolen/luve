import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { KeysModule } from '../keys/keys.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [AuthModule, KeysModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
