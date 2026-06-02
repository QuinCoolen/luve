import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PingModule } from './ping/ping.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProd ? 'info' : 'debug',
        // Reuse an inbound request id or mint one; echo it back on the response
        // so it shows up in every log line for the request.
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const header = req.headers['x-request-id'];
          const id =
            (Array.isArray(header) ? header[0] : header) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        ...(isProd
          ? {}
          : {
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true },
              },
            }),
      },
    }),
    CqrsModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    PingModule,
  ],
  providers: [
    // Serialize responses through Zod DTOs where declared (@ZodSerializerDto).
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
