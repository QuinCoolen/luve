import { defineService } from '@luve/service-kit';
import { AppModule } from './app.module.js';

export const service = defineService({
  name: 'identity',
  title: 'Luve Identity API',
  description: 'Accounts, sessions and JWT issuing (JWKS).',
  module: AppModule,
});
