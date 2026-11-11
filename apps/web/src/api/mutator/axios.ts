import Axios, { AxiosError, AxiosRequestConfig } from "axios";

/**
 * Shared axios instance used by every Orval-generated endpoint.
 * - `baseURL` from NEXT_PUBLIC_API_URL so the same client works in any env.
 * - `withCredentials` so the httpOnly auth cookies ride along on every request.
 */
export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5218",
  withCredentials: true,
});

/** RFC 7807 problem+json shape the API returns for every error. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Record<string, string[]>;
}

/** Typed error thrown for any non-2xx response, parsed from problem+json. */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly type: string;
  readonly errors?: Record<string, string[]>;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.title = problem.title;
    this.detail = problem.detail;
    this.type = problem.type;
    this.errors = problem.errors;
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "title" in value
  );
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetails>) => {
    const data = error.response?.data;
    if (isProblemDetails(data)) {
      return Promise.reject(new ApiError(data));
    }
    return Promise.reject(error);
  },
);

/**
 * Orval mutator. Orval calls this for every request, passing the request config
 * (including the `signal` for cancellation) and returns the response body.
 */
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return AXIOS_INSTANCE(config).then((response) => response.data as T);
};

export default customInstance;
