// ApiError.ts
export class ApiError extends Error {
  status: number;
  errors?: { type: string; msg: string; path: string; value?: unknown; location?: string }[];

  constructor(
    status: number,
    message: string,
    errors?: { type: string; msg: string; path: string; value?: unknown; location?: string }[]
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}