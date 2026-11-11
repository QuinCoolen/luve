import { Controller, Get, Header, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { JWK } from 'jose';
import { SigningKeys } from './signing-keys.js';

/**
 * `GET /.well-known/jwks.json`: the public keys other services verify access
 * tokens with. Outside `/api/v1` (see service.ts) and out of the OpenAPI
 * document; services call it directly, not through the gateway.
 */
@ApiExcludeController()
@Controller({ path: '.well-known', version: VERSION_NEUTRAL })
export class JwksController {
  constructor(private readonly keys: SigningKeys) {}

  @Get('jwks.json')
  @Header('Cache-Control', 'public, max-age=300')
  jwks(): { keys: JWK[] } {
    return { keys: [this.keys.publicJwk] };
  }
}
