import { MessagingModule } from '@luve/messaging';
import { JwtAuthModule } from '@luve/service-kit';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { type Env, envSchema } from './env.js';
import { KeysModule } from './keys/keys.module.js';
import { SigningKeys } from './keys/signing-keys.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Reads .env and refuses to start when a variable is missing or invalid.
    ConfigModule.forRoot({ isGlobal: true, validate: (config) => envSchema.parse(config) }),
    PrismaModule,
    MessagingModule.forRoot({
      service: 'identity',
      prisma: { imports: [PrismaModule], token: PrismaService },
    }),
    // identity verifies its own tokens with the key it signs them with; the
    // other services fetch the same public key from /.well-known/jwks.json.
    JwtAuthModule.forRootAsync({
      imports: [KeysModule],
      inject: [SigningKeys, ConfigService],
      useFactory: (keys: SigningKeys, config: ConfigService<Env, true>) => ({
        issuer: config.get('JWT_ISSUER', { infer: true }),
        audience: config.get('JWT_AUDIENCE', { infer: true }),
        jwks: { keys: [keys.publicJwk] },
      }),
    }),
    KeysModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
