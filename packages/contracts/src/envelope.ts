import { z } from 'zod';

/**
 * Metadata every integration event carries, whatever its type. Published on
 * the `luve.events` topic exchange with the routing key `type`, and the AMQP
 * `messageId` set to `eventId`.
 */
export const EnvelopeMetaSchema = z.object({
  /** Unique per event (UUIDv7). Consumers dedupe on it: delivery is at-least-once. */
  eventId: z.uuid(),
  /** `<service>.<event>.v<n>`, also the routing key, e.g. `identity.user-registered.v1`. */
  type: z.string().regex(/^[a-z]+\.[a-z0-9-]+\.v\d+$/),
  /** When the change happened (ISO 8601). */
  occurredAt: z.iso.datetime({ offset: true }),
  /** The service that published it. */
  producer: z.string().min(1),
  /** Id shared by every event in one chain of reactions. */
  correlationId: z.string().min(1).optional(),
  /** The event or command that directly caused this one. */
  causationId: z.string().min(1).optional(),
});

export type EnvelopeMeta = z.infer<typeof EnvelopeMetaSchema>;

export type Envelope<TType extends string, TData> = Omit<EnvelopeMeta, 'type'> & {
  type: TType;
  data: TData;
};

/** A versioned integration event: its routing key and the schema of its `data`. */
export interface EventContract<TType extends string, TData extends z.ZodType> {
  readonly type: TType;
  readonly data: TData;
  /** Schema of the whole envelope, for validating a received message. */
  readonly envelope: z.ZodType<Envelope<TType, z.infer<TData>>>;
}

/**
 * Declares an integration event. The type string is the contract: a breaking
 * change to `data` means a new version (`.v2`), published next to the old one
 * until every consumer has moved.
 */
export function defineEvent<const TType extends string, TData extends z.ZodType>(
  type: TType,
  data: TData,
): EventContract<TType, TData> {
  const envelope = EnvelopeMetaSchema.extend({
    type: z.literal(type),
    data,
  }) as unknown as z.ZodType<Envelope<TType, z.infer<TData>>>;
  return { type, data, envelope };
}

export type EventData<C> = C extends EventContract<string, infer D> ? z.infer<D> : never;
export type EventEnvelope<C> =
  C extends EventContract<infer T, infer D> ? Envelope<T, z.infer<D>> : never;
