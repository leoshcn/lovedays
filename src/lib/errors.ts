import { z } from "zod";

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation_error: 400,
  internal: 500,
};

/** Expected, user-facing error. Thrown by services; mapped to HTTP / MCP / form errors at the edge. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return STATUS[this.code];
  }
}

/** Normalize anything thrown into an AppError. Unknown errors are logged and hidden. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof z.ZodError) {
    const message = err.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return new AppError("validation_error", message);
  }
  console.error("[lovedays] unexpected error", err);
  return new AppError("internal", "Internal server error");
}

export function errorResponse(err: unknown): Response {
  const e = toAppError(err);
  return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
}
