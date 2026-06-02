import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

/**
 * RFC 7807 "problem details" — the single response shape for every error.
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  /** A URI reference identifying the problem type (relative is fine). */
  type: string;
  /** Short, human-readable summary of the problem type. */
  title: string;
  /** HTTP status code. */
  status: number;
  /** Human-readable explanation specific to this occurrence. */
  detail: string;
  /** URI reference identifying the specific occurrence (the request path). */
  instance: string;
  /** Field-keyed validation messages, when applicable. */
  errors?: Record<string, string[]>;
}

const TITLES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

const TYPES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: '/errors/validation',
  [HttpStatus.UNAUTHORIZED]: '/errors/unauthorized',
  [HttpStatus.FORBIDDEN]: '/errors/forbidden',
  [HttpStatus.NOT_FOUND]: '/errors/not-found',
  [HttpStatus.CONFLICT]: '/errors/conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: '/errors/rate-limit',
};

/**
 * Catches everything and renders it as `application/problem+json`. Handles Zod
 * validation errors (field-keyed), Nest `HttpException`s, and any other thrown
 * value (treated as a 500 without leaking internals).
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
    const instance = (httpAdapter.getRequestUrl(request) as string) ?? '';

    const problem = this.toProblem(exception, instance);

    if (problem.status >= 500) {
      this.logger.error(
        `${problem.status} ${problem.title} at ${instance}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    httpAdapter.reply(response, problem, problem.status);
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    // Request validation failures from nestjs-zod's ZodValidationPipe.
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      return this.validationProblem(zodError, instance);
    }

    // A ZodError thrown directly (defensive).
    if (exception instanceof ZodError) {
      return this.validationProblem(exception, instance);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const { detail, errors } = this.fromHttpException(exception);
      return {
        type: this.typeFor(status),
        title: TITLES[status] ?? exception.name,
        status,
        detail,
        instance,
        ...(errors ? { errors } : {}),
      };
    }

    return {
      type: '/errors/internal',
      title: TITLES[HttpStatus.INTERNAL_SERVER_ERROR]!,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
      instance,
    };
  }

  private validationProblem(
    zodError: unknown,
    instance: string,
  ): ProblemDetails {
    const base: ProblemDetails = {
      type: '/errors/validation',
      title: 'Validation Failed',
      status: HttpStatus.BAD_REQUEST,
      detail: 'One or more fields failed validation.',
      instance,
    };
    return zodError instanceof ZodError
      ? { ...base, errors: this.fieldErrors(zodError) }
      : base;
  }

  private fieldErrors(zodError: ZodError): Record<string, string[]> {
    const fields: Record<string, string[]> = {};
    for (const issue of zodError.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      (fields[key] ??= []).push(issue.message);
    }
    return fields;
  }

  private fromHttpException(exception: HttpException): {
    detail: string;
    errors?: Record<string, string[]>;
  } {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { detail: response };
    }

    if (typeof response === 'object' && response !== null) {
      const body = response as Record<string, unknown>;
      const message = body.message;

      // class-validator style: message is an array of strings.
      if (Array.isArray(message)) {
        return {
          detail: 'One or more fields failed validation.',
          errors: { '(root)': message.map(String) },
        };
      }

      if (typeof message === 'string') {
        return { detail: message };
      }
    }

    return { detail: exception.message };
  }

  private typeFor(status: number): string {
    const mapped = TYPES[status];
    if (mapped) return mapped;
    if (status >= 500) return '/errors/internal';
    return '/errors/http';
  }
}
