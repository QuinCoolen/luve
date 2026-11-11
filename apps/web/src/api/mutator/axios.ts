import Axios, { AxiosError, type AxiosRequestConfig } from "axios";

/**
 * Shared axios instance used by every Orval-generated client.
 *
 * - Browser: same origin (`NEXT_PUBLIC_API_URL` is normally empty); the
 *   Traefik gateway serves both the app and /api/v1/*.
 * - Server (getServerSideProps): `INTERNAL_API_URL`, the gateway as seen from
 *   the Next.js process.
 * - `withCredentials` so the httpOnly auth cookies ride along.
 */
const isServer = typeof window === "undefined";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: isServer
    ? (process.env.INTERNAL_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? ""),
  withCredentials: true,
});

/** RFC 9457 problem details: the error body every Luve service returns. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Record<string, string[]>;
}

/** Thrown for every non-2xx response, parsed from problem+json. */
export class ApiError extends Error {
  readonly status: number;
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly errors: Record<string, string[]>;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.type = problem.type;
    this.title = problem.title;
    this.detail = problem.detail;
    this.errors = problem.errors ?? {};
  }

  /** Messages for one field (e.g. `email`), for showing next to the input. */
  fieldErrors(field: string): string[] {
    return this.errors[field] ?? [];
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === "object" && value !== null && "status" in value && "title" in value;
}

function toApiError(error: AxiosError): unknown {
  const data = error.response?.data;
  if (isProblemDetails(data)) {
    return new ApiError(data);
  }
  if (error.response) {
    return new ApiError({
      type: "/errors/http",
      title: error.response.statusText || "Request failed",
      status: error.response.status,
      detail: error.message,
      instance: error.config?.url ?? "",
    });
  }
  return error;
}

// --- silent refresh ---------------------------------------------------------
// Access tokens live 15 minutes. When a request fails with 401, ask identity
// for a new one (the refresh cookie is scoped to /api/v1/auth) and retry the
// request once. Concurrent 401s share one refresh call.

const REFRESH_URL = "/api/v1/auth/refresh";
const AUTH_URLS = ["/api/v1/auth/refresh", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/logout"];
let refreshing: Promise<void> | null = null;

/** Exchanges the refresh cookie for a new access cookie. Rejects if the session is over. */
export function refreshSession(): Promise<void> {
  refreshing ??= AXIOS_INSTANCE.post(REFRESH_URL)
    .then(() => undefined)
    .catch((error: unknown) => {
      // Another tab rotated the token a moment ago: the browser already has
      // the new cookies, so the session is fine.
      if (error instanceof ApiError && error.type === "/errors/refresh-token-stale") {
        return undefined;
      }
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const url = config?.url ?? "";
    const canRefresh =
      !isServer &&
      error.response?.status === 401 &&
      config !== undefined &&
      !config._retried &&
      !AUTH_URLS.some((authUrl) => url.startsWith(authUrl));

    if (canRefresh) {
      config._retried = true;
      try {
        await refreshSession();
        return AXIOS_INSTANCE(config);
      } catch {
        // Session is over: surface the original 401.
      }
    }
    return Promise.reject(toApiError(error));
  },
);

/**
 * Orval mutator: every generated function calls this with the request config
 * (plus per-call `options`, e.g. forwarded cookies during SSR).
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return AXIOS_INSTANCE({ ...config, ...options }).then((response) => response.data as T);
};

/** Tells Orval which error type the generated hooks expose (the parameter is Orval's convention). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Error> = ApiError;

export default customInstance;
