// Creates demo users through the public API (not straight into the
// databases), the same two steps the web app takes:
//   1. auth:  POST /api/v1/auth/register  (email + password, signs in)
//   2. users: PATCH /api/v1/users/me      (choose a username)
// so auth publishes auth.user-registered.v1 like for any other user.
//
// Run with the stack up: pnpm seed
// Target another gateway with SEED_API_URL (default http://localhost:8000).

const api = process.env['SEED_API_URL'] ?? 'http://localhost:8000';

const demoUsers = [
  { email: 'alice@luve.dev', username: 'alice', password: 'Password123' },
  { email: 'bob@luve.dev', username: 'bob', password: 'Password123' },
];

/** The `jwt=…` access-token cookie from a sign-in response. */
function accessCookie(res: Response): string {
  const cookie = res.headers.getSetCookie().find((header) => header.startsWith('jwt='));
  if (!cookie) {
    throw new Error('no access-token cookie in the response');
  }
  return cookie.split(';')[0]!;
}

for (const user of demoUsers) {
  const registered = await fetch(`${api}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  if (registered.status === 409) {
    console.log(`exists   ${user.email}`);
    continue;
  }
  if (registered.status !== 201) {
    console.error(`failed   ${user.email}: ${registered.status} ${await registered.text()}`);
    process.exitCode = 1;
    continue;
  }

  const named = await fetch(`${api}/api/v1/users/me`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie: accessCookie(registered) },
    body: JSON.stringify({ username: user.username }),
  });
  if (named.ok) {
    console.log(`created  ${user.email} (${user.username}) / ${user.password}`);
  } else {
    console.error(`failed   ${user.email}: username ${named.status} ${await named.text()}`);
    process.exitCode = 1;
  }
}
