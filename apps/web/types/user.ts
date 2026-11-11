/** The signed-in user, as returned by identity (GET /api/v1/auth/me). */
export type { Me as User } from "@/api/generated/identity/model";

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