import type { JWK } from 'jose';

/** httpOnly cookie holding the short-lived access token (sent on every request). */
export const ACCESS_TOKEN_COOKIE = 'jwt';
/** httpOnly cookie holding the refresh token (only sent to /api/v1/auth). */
export const REFRESH_TOKEN_COOKIE = 'refresh';

/** Access tokens are signed by identity with Ed25519. */
export const ACCESS_TOKEN_ALGORITHM = 'EdDSA';

export const JWT_AUTH_OPTIONS = Symbol('luve:jwt-auth-options');

export interface JwtAuthOptions {
  issuer: string;
  audience: string;
  /**
   * Where the public keys come from: identity's JWKS endpoint (every other
   * service; fetched once and cached), or the keys themselves (identity).
   */
  jwks: { url: string } | { keys: JWK[] };
}

/** The authenticated caller, taken from the access token's claims. */
export interface AuthUser {
  id: string;
  username: string;
}
