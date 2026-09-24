import { describe, expect, test } from "vitest";

import { challengeBlocker } from "@/components/challenge/challenge-blocker";
import type { LiveChallenges, LiveFriends } from "@/stores/connection-store";

const ada = { id: "ada", handle: "ada", image: null };

const friends: LiveFriends = {
  presences: new Map([
    ["ada", "online"],
    ["alan", "in-duel"],
  ]),
  requestsReceived: 0,
};

const none: LiveChallenges = { sent: null, received: [] };

const idle = { place: { at: "idle" }, friends, challenges: none } as const;

describe("why a Friend cannot be challenged", () => {
  test("nothing stops a Friend online while the User is free", () => {
    expect(challengeBlocker(idle, "ada")).toBeNull();
  });

  test("a Friend offline or in a Duel", () => {
    expect(challengeBlocker(idle, "bob")).toBe("Hors ligne");
    expect(challengeBlocker(idle, "alan")).toBe("En Duel");
  });

  test("the User is in a Duel themselves", () => {
    expect(challengeBlocker({ ...idle, place: { at: "duel", here: false } }, "ada")).toBe(
      "Tu es en Duel",
    );
  });

  test("the User's Challenge waits for its answer, from this Friend or another", () => {
    const sent = { sent: { id: "c1", to: ada, expiresAt: 0 }, received: [] };

    expect(challengeBlocker({ ...idle, challenges: sent }, "ada")).toBe(
      "Challenge envoyé, en attente de sa réponse",
    );
    expect(challengeBlocker({ ...idle, challenges: sent }, "bob")).toBe(
      "Un Challenge attend déjà sa réponse",
    );
  });

  test("the connection has not told the Friends or the Challenges yet", () => {
    expect(challengeBlocker({ ...idle, challenges: null }, "ada")).toBe("Connexion au serveur…");
  });
});
