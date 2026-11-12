export {
  defineEvent,
  EnvelopeMetaSchema,
  type Envelope,
  type EnvelopeMeta,
  type EventContract,
  type EventData,
  type EventEnvelope,
} from './envelope.js';
export { authEvents, UserDeletedV1, UserRegisteredV1 } from './auth.js';

/** The topic exchange every integration event is published on. */
export const EVENTS_EXCHANGE = 'luve.events';
