import type { GetServerSidePropsContext, Redirect } from "next";
import { me } from "@/api/generated/identity/endpoints";
import type { Me } from "@/api/generated/identity/model";

/**
 * Resolves the signed-in user during SSR by forwarding the browser's cookies
 * to identity (GET /api/v1/auth/me through the gateway). Returns null when
 * there is no valid access token.
 */
export async function getSessionUser(context: GetServerSidePropsContext): Promise<Me | null> {
  const cookie = context.req.headers.cookie;
  if (!cookie) {
    return null;
  }
  try {
    return await me({ headers: { cookie } });
  } catch {
    return null;
  }
}

/**
 * Sends the visitor to /login, remembering where they wanted to go. The login
 * page first tries a silent refresh: the refresh cookie is scoped to
 * /api/v1/auth, so page requests like this one never carry it and an expired
 * access token alone doesn't mean the session is over.
 */
export function redirectToLogin(context: GetServerSidePropsContext): { redirect: Redirect } {
  return {
    redirect: {
      destination: `/login?next=${encodeURIComponent(context.resolvedUrl)}`,
      permanent: false,
    },
  };
}
