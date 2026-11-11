import { MessagingModule, RabbitMqReadinessCheck } from '@luve/messaging';
import { ConfigKitModule, HealthKitModule, JwtAuthModule, LoggingModule } from '@luve/service-kit';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { type Env, envSchema } from './env.js';
import { KeysModule } from './keys/keys.module.js';
import { SigningKeys } from './keys/signing-keys.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaReadinessCheck } from './prisma/prisma.readiness.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigKitModule.forRoot(envSchema),
    LoggingModule.forRoot('identity'),
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
    HealthKitModule.forRoot({ checks: [PrismaReadinessCheck, RabbitMqReadinessCheck] }),
    KeysModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
