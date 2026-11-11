import { AuthProblems } from './auth.problems.js';

/**
 * Runs `work` and turns a unique-constraint violation (Prisma P2002), which a
 * concurrent registration can cause after the friendly pre-check passed, into
 * the same 409 the pre-check would have returned.
 */
export async function withUniqueGuard<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code === 'P2002') {
      throw AuthProblems.taken({ email: 'This email or username is already taken.' });
    }
    throw error;
  }
}
