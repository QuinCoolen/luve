/**
 * A dependency the service needs before it can take traffic (database, broker,
 * …). `check()` resolves when healthy and throws (or rejects) otherwise.
 */
export interface ReadinessCheck {
  readonly name: string;
  check(): Promise<void>;
}

export const READINESS_CHECKS = Symbol('luve:readiness-checks');
