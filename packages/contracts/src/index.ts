export {
  defineEvent,
  EnvelopeMetaSchema,
  type Envelope,
  type EnvelopeMeta,
  type EventContract,
  type EventData,
  type EventEnvelope,
} from './envelope.js';
export { identityEvents, UserDeletedV1, UserRegisteredV1, UserUpdatedV1 } from './identity.js';

/** The topic exchange every integration event is published on. */
export const EVENTS_EXCHANGE = 'luve.events';
