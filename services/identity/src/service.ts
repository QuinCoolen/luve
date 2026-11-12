import { defineService } from '@luve/service-kit';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module.js';

export const service = defineService({
  name: 'identity',
  title: 'Luve Identity API',
  description: 'Accounts, sessions and JWT issuing (JWKS).',
  port: 4001,
  module: AppModule,
  excludeFromPrefix: [{ path: '.well-known/jwks.json', method: RequestMethod.GET }],
});
