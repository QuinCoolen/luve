import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import type { BaseEnv } from '../config/env.schema.js';

export const REQUEST_ID_HEADER = 'x-request-id';

// Resolved from this package so pino's worker thread finds pino-pretty no
// matter how pnpm laid out the consuming service's node_modules.
const prettyTarget = createRequire(import.meta.url).resolve('pino-pretty');

/**
 * Structured logging with pino. Every line carries the service name and the
 * request id (taken from `x-request-id`, which Traefik forwards, or minted
 * here) and the id is echoed on the response. Pretty output in development,
 * JSON everywhere else.
 */
@Module({})
export class LoggingModule {
  static forRoot(service: string): DynamicModule {
    return {
      module: LoggingModule,
      imports: [
        LoggerModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService<BaseEnv, true>) => {
            const nodeEnv = config.get('NODE_ENV', { infer: true });
            const level =
              config.get('LOG_LEVEL', { infer: true }) ??
              (nodeEnv === 'production' ? 'info' : 'debug');
            return {
              pinoHttp: {
                name: service,
                level,
                genReqId: (req: IncomingMessage, res: ServerResponse) => {
                  const header = req.headers[REQUEST_ID_HEADER];
                  const id = (Array.isArray(header) ? header[0] : header) ?? randomUUID();
                  res.setHeader(REQUEST_ID_HEADER, id);
                  return id;
                },
                autoLogging: {
                  ignore: (req: IncomingMessage) => req.url?.startsWith('/health/') ?? false,
                },
                ...(nodeEnv === 'development'
                  ? { transport: { target: prettyTarget, options: { singleLine: true } } }
                  : {}),
              },
            };
          },
        }),
      ],
    };
  }
}
