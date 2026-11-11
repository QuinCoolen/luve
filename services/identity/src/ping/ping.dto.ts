import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Response shape for the ping endpoint — also drives the OpenAPI schema. */
export const PingResponseSchema = z.object({
  ok: z.literal(true),
});

export class PingResponseDto extends createZodDto(PingResponseSchema) {}
