export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
}

export class ValidationError extends Error {
  constructor(message: string, errors: { [key: string]: string[] }) {
    super(message);
    this.errors = errors;
    this.name = "ValidationError";
  }

  errors: { [key: string]: string[] };
}