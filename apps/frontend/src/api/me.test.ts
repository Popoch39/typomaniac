import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/client";
import { toMe } from "@/api/me";

const user = { id: "u1", name: "Ada Lovelace", email: "ada@example.com", image: null };

// An error body as the API writes it (ApiErrorBody).
const failure = (code: string, status: number) => ({
  data: null,
  error: { value: { error: { code, message: "…", requestId: "r1" } } },
  status,
});

describe("toMe", () => {
  test("UNAUTHORIZED means a Visitor, not an error", () => {
    expect(toMe(failure("UNAUTHORIZED", 401))).toBeNull();
  });

  test("a 200 gives the signed-in User", () => {
    expect(toMe({ data: user, error: null, status: 200 })).toEqual(user);
  });

  test("any other failure is thrown as an ApiError", () => {
    expect(() => toMe(failure("INTERNAL_SERVER_ERROR", 500))).toThrow(ApiError);
  });

  test("a 401 not in the API's format is thrown, not taken for a Visitor", () => {
    expect(() => toMe({ data: null, error: { value: "Unauthorized" }, status: 401 })).toThrow(
      ApiError,
    );
  });
});
