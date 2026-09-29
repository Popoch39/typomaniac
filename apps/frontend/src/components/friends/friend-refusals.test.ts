import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/client";
import { friendErrorMessage } from "@/components/friends/friend-refusals";

// The API refusing an action on another User, for the rule it names.
const refused = (reason: string) =>
  new ApiError(403, {
    error: {
      code: "FORBIDDEN",
      message: "…",
      requestId: "r1",
      details: [{ path: "/userId", message: reason }],
    },
  });

const tooMany = new ApiError(429, {
  error: { code: "TOO_MANY_REQUESTS", message: "…", requestId: "r1" },
});

describe("friendErrorMessage", () => {
  test("says the rule the action broke", () => {
    expect(friendErrorMessage(refused("friend-limit"), "fr")).toBe(
      "Tu as atteint le nombre maximum de Friends.",
    );
    expect(friendErrorMessage(refused("already-requested"), "en")).toBe(
      "A Friend request is already waiting for an answer.",
    );
    expect(friendErrorMessage(refused("not-friends"), "en")).toBe("You're no longer Friends.");
  });

  test("says to wait after too many actions in a row", () => {
    expect(friendErrorMessage(tooMany, "fr")).toBe(
      "Trop de Friend requests d'affilée : patiente un instant.",
    );
    expect(friendErrorMessage(tooMany, "en")).toBe(
      "Too many Friend requests in a row. Give it a moment.",
    );
  });

  test("a plain failure otherwise: an unknown rule, or no answer from the API", () => {
    expect(friendErrorMessage(refused("unheard-of"), "en")).toBe("That didn't work. Try again.");
    expect(friendErrorMessage(new Error("offline"), "fr")).toBe("L'action a échoué. Réessaie.");
  });
});
