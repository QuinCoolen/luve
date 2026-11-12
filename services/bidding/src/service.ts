import { defineService } from '@luve/service-kit';
import { AppModule } from './app.module.js';

export const service = defineService({
  name: 'bidding',
  title: 'Luve Bidding API',
  description: 'Event-sourced bidding (ES + CQRS with @ocoda/event-sourcing).',
  port: 4003,
  module: AppModule,
});
