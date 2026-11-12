import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@luve/contracts';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { type Env, envSchema } from './env.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';

@Module({
  imports: [
    // Reads .env and refuses to start when a variable is missing or invalid.
    ConfigModule.forRoot({ isGlobal: true, validate: (config) => envSchema.parse(config) }),
    // Connects at startup (and fails to start without RabbitMQ), then declares
    // this service's queue for the @RabbitSubscribe handler in profiles/.
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('RABBITMQ_URL', { infer: true }),
        exchanges: [{ name: EVENTS_EXCHANGE, type: 'topic', options: { durable: true } }],
      }),
    }),
    PrismaModule,
    ProfilesModule,
  ],
})
export class AppModule {}
