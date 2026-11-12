import { Module } from '@nestjs/common';
import { AccessTokens } from './access-tokens.js';
import { JwksController } from './jwks.controller.js';
import { SigningKeys } from './signing-keys.js';

@Module({
  controllers: [JwksController],
  providers: [SigningKeys, AccessTokens],
  exports: [SigningKeys, AccessTokens],
})
export class KeysModule {}
