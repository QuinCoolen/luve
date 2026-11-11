import type { Envelope, EventContract } from '@luve/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { Outbox } from '@nestjs/outbox';
import { v7 as uuidv7 } from 'uuid';
import type { z } from 'zod';

export const PRODUCER = Symbol('luve:producer');

export interface StageOptions {
  /**
   * Ordering key: the outbox publishes messages with the same key in commit
   * order (e.g. the user or auction id the event is about).
   */
  key?: string;
  /** The request id (or upstream correlation id) this change came from. */
  correlationId?: string;
  /** The event or command that directly caused this event. */
  causationId?: string;
  occurredAt?: Date;
}

/**
 * Publishes integration events through the transactional outbox. `stage()`
 * must be called with the service's open database transaction: the event row
 * commits (or rolls back) together with the state change, and the relay
 * delivers it to RabbitMQ afterwards. There is no other way to publish, so no
 * code path can "save, then publish" and lose events.
 */
@Injectable()
export class IntegrationEvents {
  constructor(
    private readonly outbox: Outbox,
    @Inject(PRODUCER) private readonly producer: string,
  ) {}

  /** Validates `data` against the contract and adds the event to the outbox inside `tx`. */
  async stage<TType extends string, TData extends z.ZodType>(
    tx: unknown,
    contract: EventContract<TType, TData>,
    data: z.input<TData>,
    options: StageOptions = {},
  ): Promise<Envelope<TType, z.infer<TData>>> {
    const envelope: Envelope<TType, z.infer<TData>> = {
      eventId: uuidv7(),
      type: contract.type,
      occurredAt: (options.occurredAt ?? new Date()).toISOString(),
      producer: this.producer,
      ...(options.correlationId ? { correlationId: options.correlationId } : {}),
      ...(options.causationId ? { causationId: options.causationId } : {}),
      data: contract.data.parse(data),
    };

    await this.outbox.add(tx, {
      id: envelope.eventId,
      topic: contract.type,
      payload: envelope,
      key: options.key ?? null,
      headers: {
        'x-producer': this.producer,
        ...(options.correlationId ? { 'x-correlation-id': options.correlationId } : {}),
      },
    });
    return envelope;
  }

  /** Wakes the relay once the transaction has committed, instead of waiting for its next poll. */
  flush(): void {
    this.outbox.notify();
  }
}
