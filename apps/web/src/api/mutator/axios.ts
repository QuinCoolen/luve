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

/**
 * NestJS's default error body: `{ statusCode, message, error }`. `message` is
 * one string, or a list for validation errors, where each entry reads
 * `field: what's wrong` (e.g. `email: Invalid email address`).
 */
interface NestErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

const FIELD_MESSAGE = /^([\w.]+): (.+)$/;

/** Thrown for every non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(" ") || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
  }

  /** Messages about one field (`email: …`), for showing next to that input. */
  fieldErrors(field: string): string[] {
    return this.messages.flatMap((message) => {
      const match = FIELD_MESSAGE.exec(message);
      return match?.[1] === field ? [match[2]!] : [];
    });
  }

  /** Messages that aren't about one field, e.g. "The email or password is incorrect." */
  generalErrors(): string[] {
    return this.messages.filter((message) => !FIELD_MESSAGE.test(message));
  }
}

function isNestErrorBody(value: unknown): value is NestErrorBody {
  return typeof value === "object" && value !== null && "statusCode" in value && "message" in value;
}

function toApiError(error: AxiosError): unknown {
  if (!error.response) {
    return error;
  }
  const data = error.response.data;
  const messages = isNestErrorBody(data)
    ? [data.message].flat()
    : [error.response.statusText || "Request failed"];
  return new ApiError(error.response.status, messages);
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
      // 409: another tab rotated the token a moment ago. The browser already
      // has the new cookies, so the session is fine.
      if (error instanceof ApiError && error.status === 409) {
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
