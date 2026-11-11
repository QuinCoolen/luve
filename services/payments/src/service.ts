import { defineService } from '@luve/service-kit';
import { AppModule } from './app.module.js';

export const service = defineService({
  name: 'payments',
  title: 'Luve Payments API',
  description: 'Stripe checkout for won auctions.',
  module: AppModule,
});
