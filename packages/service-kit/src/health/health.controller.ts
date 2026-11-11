import { Controller, Get, HttpStatus, Inject, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { READINESS_CHECKS, type ReadinessCheck } from './readiness-check.js';

export interface ReadinessReport {
  status: 'ok' | 'error';
  /** Per check: `up`, or `down` with the failure message. */
  details: Record<string, { status: 'up' } | { status: 'down'; message: string }>;
}

/** A check that hangs counts as down after this long. */
const CHECK_TIMEOUT_MS = 3_000;

/**
 * Probes, kept outside `/api/v1` (see `applyRouting`) and out of the OpenAPI
 * document:
 * - `GET /health/live`: the process is up (unconditional 200).
 * - `GET /health/ready`: every registered `ReadinessCheck` passes, else 503.
 */
@ApiExcludeController()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@Inject(READINESS_CHECKS) private readonly checks: ReadinessCheck[]) {}

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response): Promise<ReadinessReport> {
    const results = await Promise.all(
      this.checks.map(async (readiness) => {
        try {
          await withTimeout(readiness.check(), CHECK_TIMEOUT_MS);
          return [readiness.name, { status: 'up' }] as const;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return [readiness.name, { status: 'down', message }] as const;
        }
      }),
    );

    const details: ReadinessReport['details'] = Object.fromEntries(results);
    const healthy = results.every(([, result]) => result.status === 'up');
    if (!healthy) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: healthy ? 'ok' : 'error', details };
  }
}

async function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
  });
  try {
    await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
