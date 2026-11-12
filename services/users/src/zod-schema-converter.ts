import type { SwaggerDocumentOptions } from '@nestjs/swagger';
import { createSchema } from 'zod-openapi';

type Converter = NonNullable<SwaggerDocumentOptions['standardSchemaConverter']>;

/**
 * Turns Zod schemas into OpenAPI with `zod-openapi`, which gives every schema
 * with `.meta({ id: 'Name' })` its own named component. That's why the web
 * client has readable types like `PublicProfile` instead of `GetApiV1UsersId200`.
 */
export const zodSchemaConverter: Converter = (schema, { schemaType }) => {
  const isZod = (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor === 'zod';
  if (!isZod) {
    return undefined;
  }
  const converted = createSchema(schema as never, { io: schemaType, openapiVersion: '3.0.0' });
  return { schema: converted.schema, components: converted.components };
};
