import type { SwaggerDocumentOptions } from '@nestjs/swagger';
import { createSchema } from 'zod-openapi';

type Converter = NonNullable<SwaggerDocumentOptions['standardSchemaConverter']>;

function isZodSchema(schema: unknown): boolean {
  return (
    !!schema &&
    typeof schema === 'object' &&
    (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor === 'zod'
  );
}

/**
 * Converts Zod schemas with `zod-openapi`, which hoists every schema that has
 * `.meta({ id: 'Name' })` into `components.schemas`. Named components give the
 * Orval-generated client readable type names (`Me`, `ProblemDetails`, …)
 * instead of `PostApiV1AuthLogin200`. Non-Zod schemas fall back to Nest's
 * native Standard JSON Schema conversion.
 */
export const zodStandardSchemaConverter: Converter = (schema, { schemaType }) => {
  if (!isZodSchema(schema)) {
    return undefined;
  }
  const converted = createSchema(schema as never, {
    io: schemaType,
    openapiVersion: '3.0.0',
  });
  return { schema: converted.schema, components: converted.components };
};
