import { describe, expect, test } from "vitest";

import {
  challengeRefusalMessage,
  sentChallengeEndingMessage,
} from "@/components/challenge/challenge-messages";

describe("challengeRefusalMessage", () => {
  test("says the rule the Challenge broke", () => {
    expect(challengeRefusalMessage("offline", "fr")).toBe("Ce Friend est hors ligne.");
    expect(challengeRefusalMessage("offline", "en")).toBe("This Friend is offline.");
    expect(challengeRefusalMessage("already-challenging", "en")).toBe(
      "Your last Challenge is still waiting for an answer.",
    );
  });
});

describe("sentChallengeEndingMessage", () => {
  test("says how the User's Challenge ended without a Duel", () => {
    expect(sentChallengeEndingMessage("alan", "declined", "fr")).toBe(
      "@alan a refusé ton Challenge.",
    );
    expect(
      (["declined", "expired", "unavailable"] as const).map((reason) =>
        sentChallengeEndingMessage("alan", reason, "en"),
      ),
    ).toEqual([
      "@alan declined your Challenge.",
      "@alan didn't answer your Challenge.",
      "@alan is no longer available for your Challenge.",
    ]);
  });

  test("says nothing when the User cancelled it, or when the Duel starts", () => {
    expect(sentChallengeEndingMessage("alan", "cancelled", "en")).toBeNull();
    expect(sentChallengeEndingMessage("alan", "accepted", "en")).toBeNull();
  });
});
