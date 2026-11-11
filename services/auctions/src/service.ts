import { defineService } from '@luve/service-kit';
import { AppModule } from './app.module.js';

export const service = defineService({
  name: 'auctions',
  title: 'Luve Auctions API',
  description: 'Auction listings and their lifecycle.',
  module: AppModule,
});
