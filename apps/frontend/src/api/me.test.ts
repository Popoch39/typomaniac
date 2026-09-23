import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/client";
import { toMe } from "@/api/me";

const user = { id: "u1", name: "Ada Lovelace", email: "ada@example.com", image: null };

describe("toMe", () => {
  test("a 401 means a Visitor, not an error", () => {
    expect(
      toMe({ data: null, error: { value: { code: "UNAUTHORIZED" } }, status: 401 }),
    ).toBeNull();
  });

  test("a 200 gives the signed-in User", () => {
    expect(toMe({ data: user, error: null, status: 200 })).toEqual(user);
  });

  test("any other failure is thrown as an ApiError", () => {
    expect(() => toMe({ data: null, error: { value: { code: "INTERNAL" } }, status: 500 })).toThrow(
      ApiError,
    );
  });
});
