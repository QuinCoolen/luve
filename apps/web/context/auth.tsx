import { createContext, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getMeQueryKey, logout as logoutRequest, useMe } from "@/api/generated/identity/endpoints";
import type { Me } from "@/api/generated/identity/model";

interface AuthContextType {
  /** The signed-in user, or null. */
  user: Me | null;
  isLoading: boolean;
  /** Call after login/register succeeded with the returned user. */
  signedIn: (user: Me) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signedIn: () => {},
  logout: async () => {},
});

/**
 * The session lives in httpOnly cookies the page can't read, so "am I signed
 * in?" is answered by GET /api/v1/auth/me (cached by TanStack Query). An
 * expired access token is refreshed transparently by the axios mutator.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useMe({ query: { retry: false, staleTime: 5 * 60_000 } });

  const signedIn = useCallback(
    (user: Me) => queryClient.setQueryData(getMeQueryKey(), user),
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      queryClient.setQueryData(getMeQueryKey(), null);
    }
  }, [queryClient]);

  const value = useMemo<AuthContextType>(
    () => ({
      user: meQuery.isError ? null : (meQuery.data ?? null),
      isLoading: meQuery.isLoading,
      signedIn,
      logout,
    }),
    [meQuery.data, meQuery.isError, meQuery.isLoading, signedIn, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
