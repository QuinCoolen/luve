import { MessagingModule } from '@luve/messaging';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { envSchema } from './env.js';
import { KeysModule } from './keys/keys.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';

@Module({
  imports: [
    // Reads .env and refuses to start when a variable is missing or invalid.
    ConfigModule.forRoot({ isGlobal: true, validate: (config) => envSchema.parse(config) }),
    PrismaModule,
    MessagingModule.forRoot({
      service: 'auth',
      prisma: { imports: [PrismaModule], token: PrismaService },
    }),
    KeysModule,
    AuthModule,
  ],
})
export class AppModule {}
