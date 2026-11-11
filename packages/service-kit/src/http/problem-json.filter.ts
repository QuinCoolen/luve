import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ProblemException, type ProblemDetails } from './problem.js';
import { SchemaValidationException } from './schema-validation.exception.js';

const TITLES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

const TYPES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: '/errors/bad-request',
  [HttpStatus.UNAUTHORIZED]: '/errors/unauthorized',
  [HttpStatus.FORBIDDEN]: '/errors/forbidden',
  [HttpStatus.NOT_FOUND]: '/errors/not-found',
  [HttpStatus.CONFLICT]: '/errors/conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: '/errors/rate-limit',
};

/**
 * Catches everything and renders it as `application/problem+json`:
 * - `ProblemException`: its own type/title/detail,
 * - `SchemaValidationException`: 400 with field-keyed `errors`,
 * - any other `HttpException`: mapped by status,
 * - anything else: a 500 that never leaks internals (the stack is logged).
 */
@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<unknown>();
    const response = ctx.getResponse<unknown>();
    const instance = (httpAdapter.getRequestUrl(request) as string | undefined) ?? '';

    const problem = toProblem(exception, instance);

    if (problem.status >= 500) {
      this.logger.error(
        `${problem.status} ${problem.title} at ${instance}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    httpAdapter.reply(response, problem, problem.status);
  }
}

export function toProblem(exception: unknown, instance: string): ProblemDetails {
  if (exception instanceof ProblemException) {
    const { status, type, title, detail, errors } = exception.problem;
    return {
      type,
      title,
      status,
      detail: detail ?? title,
      instance,
      ...(errors ? { errors } : {}),
    };
  }

  if (exception instanceof SchemaValidationException) {
    return {
      type: '/errors/validation',
      title: 'Validation Failed',
      status: HttpStatus.BAD_REQUEST,
      detail: 'One or more fields failed validation.',
      instance,
      errors: exception.fieldErrors(),
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return {
      type: typeFor(status),
      title: TITLES[status] ?? exception.name,
      status,
      detail: detailOf(exception),
      instance,
    };
  }

  return {
    type: '/errors/internal',
    title: 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    detail: 'An unexpected error occurred.',
    instance,
  };
}

function detailOf(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join('; ');
  }
  return exception.message;
}

function typeFor(status: number): string {
  return TYPES[status] ?? (status >= 500 ? '/errors/internal' : '/errors/http');
}
