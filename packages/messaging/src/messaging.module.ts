import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@luve/contracts';
import {
  type DynamicModule,
  type InjectionToken,
  Module,
  type ModuleMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromPrisma, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { IntegrationEvents, PRODUCER } from './integration-events.js';
import { RabbitMqOutboxTransport } from './rabbitmq-outbox.transport.js';

export interface MessagingModuleOptions {
  /** Producer name stamped on every envelope, e.g. `auth`. */
  service: string;
  /**
   * Where the service's Prisma client comes from. The outbox store runs its
   * SQL through it, so `outbox.add(tx, …)` joins the service's transactions.
   */
  prisma: { imports: ModuleMetadata['imports']; token: InjectionToken };
}

/**
 * Wires a service to the event backbone:
 * - a RabbitMQ connection (`RABBITMQ_URL`) that tolerates the broker being
 *   down at boot and reconnects,
 * - `@nestjs/outbox` with its Postgres store (schema `nest_outbox`, next to
 *   the service's own tables) and a relay that publishes to `luve.events`,
 * - `IntegrationEvents` to stage events inside a transaction.
 *
 * Set `OUTBOX_RELAY=off` to run an instance that writes events but doesn't
 * publish them (tests, API-only replicas).
 */
@Module({})
export class MessagingModule {
  static forRoot(options: MessagingModuleOptions): DynamicModule {
    const rabbitmq = RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('RABBITMQ_URL'),
        // Declared (durable) in infra/rabbitmq/definitions.json too; asserting
        // it here keeps tests and fresh brokers working.
        exchanges: [{ name: EVENTS_EXCHANGE, type: 'topic', options: { durable: true } }],
        // Boot even when the broker is down; reconnect in the background.
        connectionInitOptions: { wait: false },
        defaultPublishOptions: { persistent: true },
      }),
    });

    return {
      module: MessagingModule,
      global: true,
      imports: [
        rabbitmq,
        ...(options.prisma.imports ?? []),
        OutboxModule.forRootAsync({
          imports: [rabbitmq],
          transports: { rabbitmq: RabbitMqOutboxTransport },
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            route: () => 'rabbitmq',
            relay: {
              enabled: config.get<string>('OUTBOX_RELAY') !== 'off',
              pollInterval: '500ms',
              publishTimeout: '10s',
            },
            retry: { attempts: 20, backoff: { delay: '1s', factor: 2, maxDelay: '1m' } },
          }),
        }),
      ],
      providers: [
        { provide: PRODUCER, useValue: options.service },
        {
          // Applies its own migrations (schema nest_outbox) at startup, in every
          // environment: fine for this project; a real deployment would run
          // `npx @nestjs/outbox migrate` before rolling out.
          provide: PostgresOutboxStore,
          inject: [options.prisma.token, OutboxStorage],
          useFactory: (prisma: Parameters<typeof fromPrisma>[0], storage: OutboxStorage) =>
            new PostgresOutboxStore({ executor: fromPrisma(prisma), migrate: true }, storage),
        },
        IntegrationEvents,
      ],
      exports: [IntegrationEvents, rabbitmq],
    };
  }
}
