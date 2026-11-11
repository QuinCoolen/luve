import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import type { ReadinessCheck } from '@luve/service-kit';
import { Injectable } from '@nestjs/common';

/** `/health/ready` fails while the RabbitMQ connection is down. */
@Injectable()
export class RabbitMqReadinessCheck implements ReadinessCheck {
  readonly name = 'rabbitmq';

  constructor(private readonly amqp: AmqpConnection) {}

  async check(): Promise<void> {
    if (!this.amqp.managedConnection.isConnected()) {
      throw new Error('not connected to RabbitMQ');
    }
  }
}
