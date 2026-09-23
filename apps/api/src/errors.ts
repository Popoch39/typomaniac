// The API's error vocabulary: every error response, whatever raised it, has the
// ApiErrorBody layout so the front handles a single format.
export const ERRORS = {
  BAD_REQUEST: { status: 400, message: "The request is malformed" },
  UNAUTHORIZED: { status: 401, message: "Authentication is required" },
  FORBIDDEN: { status: 403, message: "You are not allowed to do this" },
  NOT_FOUND: { status: 404, message: "Resource not found" },
  CONFLICT: { status: 409, message: "The resource is in a conflicting state" },
  PAYLOAD_TOO_LARGE: { status: 413, message: "The request body is too large" },
  VALIDATION_FAILED: { status: 422, message: "The request is invalid" },
  TOO_MANY_REQUESTS: { status: 429, message: "Too many requests, retry later" },
  INTERNAL_SERVER_ERROR: { status: 500, message: "Something went wrong on our side" },
} as const;

export type ErrorCode = keyof typeof ERRORS;

export type ErrorDetail = { path: string; message: string };

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: ErrorDetail[];
  };
};

// Throw it from a handler or a service: the error handler renders it.
// `throw new ApiError("FORBIDDEN", "You cannot edit this word")`
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[] | undefined;

  constructor(code: ErrorCode, message: string = ERRORS[code].message, details?: ErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = ERRORS[code].status;
    this.details = details;
  }
}

// SAFETY: ERRORS is a frozen literal, its runtime keys are exactly the ErrorCode union.
const ERROR_CODES = Object.keys(ERRORS) as ErrorCode[];

const CODE_BY_STATUS = new Map<number, ErrorCode>(
  ERROR_CODES.map((code) => [ERRORS[code].status, code]),
);

// For a status raised without a code (Elysia's `status()`), unknown ones fall back to 500.
export const codeForStatus = (status: number): ErrorCode =>
  CODE_BY_STATUS.get(status) ?? "INTERNAL_SERVER_ERROR";
