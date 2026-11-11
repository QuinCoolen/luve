import { ProblemException } from '@luve/service-kit';

/** The domain errors identity returns, each with its own problem type. */
export const AuthProblems = {
  invalidCredentials: () =>
    new ProblemException({
      status: 401,
      type: '/errors/invalid-credentials',
      title: 'Invalid credentials',
      detail: 'The email or password is incorrect.',
    }),
  invalidRefreshToken: () =>
    new ProblemException({
      status: 401,
      type: '/errors/invalid-refresh-token',
      title: 'Invalid refresh token',
      detail: 'Log in again.',
    }),
  refreshTokenStale: () =>
    new ProblemException({
      status: 401,
      type: '/errors/refresh-token-stale',
      title: 'Refresh token already rotated',
      detail:
        'Another request refreshed this session a moment ago. Retry with the current cookies.',
    }),
  refreshTokenReused: () =>
    new ProblemException({
      status: 401,
      type: '/errors/refresh-token-reused',
      title: 'Refresh token reused',
      detail: 'This session was ended for your safety. Log in again.',
    }),
  accountGone: () =>
    new ProblemException({
      status: 401,
      type: '/errors/unauthenticated',
      title: 'Account no longer exists',
      detail: 'Log in again.',
    }),
  taken: (fields: Partial<Record<'email' | 'username', string>>) =>
    new ProblemException({
      status: 409,
      type: '/errors/already-taken',
      title: 'Already taken',
      detail: Object.values(fields).join(' '),
      errors: Object.fromEntries(
        Object.entries(fields).map(([field, message]) => [field, [message]]),
      ),
    }),
} as const;
