import { defineService } from '@luve/service-kit';
import { AppModule } from './app.module.js';

export const service = defineService({
  name: 'realtime',
  title: 'Luve Realtime API',
  description: 'Socket.IO push of bidding and auction events.',
  module: AppModule,
});
