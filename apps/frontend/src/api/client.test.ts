import { describe, expect, test } from "vitest";

import { ApiError, refusalAt } from "@/api/client";

describe("ApiError", () => {
  test("reads the code, message, requestId and details of the API's error format", () => {
    const error = new ApiError(409, {
      error: {
        code: "CONFLICT",
        message: "This Handle is taken",
        requestId: "r1",
        details: [{ path: "/handle", message: "taken" }],
      },
    });

    expect(error).toMatchObject({
      status: 409,
      code: "CONFLICT",
      message: "This Handle is taken",
      requestId: "r1",
      details: [{ path: "/handle", message: "taken" }],
    });
  });

  test("a body not in the API's format has no code", () => {
    const error = new ApiError(502, "<html>Bad Gateway</html>");

    expect(error).toMatchObject({ status: 502, code: null, requestId: null, details: [] });
  });

  test("a code unknown to ERRORS is no code", () => {
    const error = new ApiError(418, { error: { code: "TEAPOT", message: "…", requestId: "r1" } });

    expect(error).toMatchObject({ code: null, requestId: "r1" });
  });
});

describe("refusalAt", () => {
  const refused = new ApiError(403, {
    error: {
      code: "FORBIDDEN",
      message: "…",
      requestId: "r1",
      details: [{ path: "/userId", message: "friend-limit" }],
    },
  });

  test("gives the rule named in the detail on that path", () => {
    expect(refusalAt(refused, "/userId")).toBe("friend-limit");
  });

  test("gives null without a detail on that path", () => {
    expect(refusalAt(refused, "/handle")).toBeNull();
  });
});
