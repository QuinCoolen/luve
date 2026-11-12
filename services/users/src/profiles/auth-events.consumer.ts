import { MessageHandlerErrorBehavior, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE, UserDeletedV1, UserRegisteredV1 } from '@luve/contracts';
import { Injectable } from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';

/** This service's own queue. RabbitMQ keeps the messages while the service is down. */
export const QUEUE = 'luve.users';

/**
 * Creates a profile when the auth service registers an account, and removes
 * it when the account is deleted.
 *
 * When a message can't be handled (it breaks its contract, or the database is
 * down), it's rejected and RabbitMQ moves it to the `luve.dead-letters` queue,
 * where you can inspect it in the management UI. Without that, the library's
 * default is to put the message back and retry it forever.
 */
@Injectable()
export class AuthEventsConsumer {
  constructor(private readonly profiles: ProfilesService) {}

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: [UserRegisteredV1.type, UserDeletedV1.type],
    queue: QUEUE,
    queueOptions: { durable: true, deadLetterExchange: 'luve.events.dlx' },
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handle(message: { type?: unknown }): Promise<void> {
    // One queue receives both event types, so pick the handler by type.
    // parse() checks the message against its contract and throws if it breaks it.
    switch (message.type) {
      case UserRegisteredV1.type: {
        const { data } = UserRegisteredV1.envelope.parse(message);
        await this.profiles.created(data.userId, new Date(data.registeredAt));
        break;
      }
      case UserDeletedV1.type: {
        const { data } = UserDeletedV1.envelope.parse(message);
        await this.profiles.deleted(data.userId);
        break;
      }
    }
  }
}
