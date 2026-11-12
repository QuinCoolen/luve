/** The signed-in user's profile, as returned by the users service (GET /api/v1/users/me). */
export type { Me as User } from "@/api/generated/users/model";

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