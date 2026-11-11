import { HttpException } from '@nestjs/common';
import { z } from 'zod';

/**
 * RFC 9457 (formerly 7807) "problem details": the one response shape for every
 * error any Luve service returns, served as `application/problem+json`.
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export const ProblemDetailsSchema = z
  .object({
    type: z
      .string()
      .describe('URI reference identifying the problem type, e.g. /errors/validation'),
    title: z.string().describe('Short, human-readable summary of the problem type'),
    status: z.number().int().describe('HTTP status code'),
    detail: z.string().describe('Explanation specific to this occurrence'),
    instance: z.string().describe('The request path that produced the problem'),
    errors: z
      .record(z.string(), z.array(z.string()))
      .optional()
      .describe('Field-keyed validation messages (dot-separated paths)'),
  })
  .meta({ id: 'ProblemDetails' });

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export interface ProblemInit {
  status: number;
  /** Relative URI identifying the problem type, e.g. `/errors/invalid-credentials`. */
  type: string;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

/**
 * Throw this for domain errors that deserve their own problem `type`
 * (e.g. `/errors/bidding-not-open`), instead of a generic HttpException.
 */
export class ProblemException extends HttpException {
  constructor(readonly problem: ProblemInit) {
    super(problem.detail ?? problem.title, problem.status);
  }
}
