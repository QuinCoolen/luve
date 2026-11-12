// Creates demo accounts through the public API (not straight into the
// database), so auth publishes auth.user-registered.v1 for each and
// the other services learn about them like any other user.
//
// Run with the stack up: pnpm --filter @luve/auth seed
// Target another gateway with SEED_API_URL (default http://localhost:8000).

const api = process.env['SEED_API_URL'] ?? 'http://localhost:8000';

const demoUsers = [
  { email: 'alice@luve.dev', username: 'alice', password: 'Password123' },
  { email: 'bob@luve.dev', username: 'bob', password: 'Password123' },
];

for (const user of demoUsers) {
  const res = await fetch(`${api}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (res.status === 201) {
    console.log(`created  ${user.email} / ${user.password}`);
  } else if (res.status === 409) {
    console.log(`exists   ${user.email}`);
  } else {
    console.error(`failed   ${user.email}: ${res.status} ${await res.text()}`);
    process.exitCode = 1;
  }
}
