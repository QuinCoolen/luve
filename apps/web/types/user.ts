/** The signed-in user, as returned by the auth service (GET /api/v1/auth/me). */
export type { Me as User } from "@/api/generated/auth/model";

export class ValidationError extends Error {
  constructor(message: string, errors: { [key: string]: string[] }) {
    super(message);
    this.errors = errors;
    this.name = "ValidationError";
  }

  errors: { [key: string]: string[] };
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}