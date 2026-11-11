import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@luve/contracts';
import { Injectable } from '@nestjs/common';
import { type OutboxMessage, OutboxTransport } from '@nestjs/outbox';

/**
 * Hands outbox messages to RabbitMQ. The outbox relay calls `publish()` for
 * every committed message; resolving tells the relay the broker has it, so the
 * message is marked published. golevelup publishes on a confirm channel, so
 * the promise only resolves once RabbitMQ acknowledged the message. Throwing
 * makes the relay retry later with backoff (and dead-letter it eventually).
 */
@Injectable()
export class RabbitMqOutboxTransport extends OutboxTransport {
  constructor(private readonly amqp: AmqpConnection) {
    super();
  }

  async publish(message: OutboxMessage): Promise<void> {
    const confirmed = await this.amqp.publish(EVENTS_EXCHANGE, message.topic, message.payload, {
      messageId: message.id,
      type: message.topic,
      contentType: 'application/json',
      persistent: true,
      timestamp: Math.floor(message.createdAt / 1000),
      headers: message.headers,
    });
    if (!confirmed) {
      throw new Error(`RabbitMQ did not confirm ${message.topic} (${message.id})`);
    }
  }
}
