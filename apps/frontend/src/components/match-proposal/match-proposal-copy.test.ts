import { describe, expect, test } from "vitest";

import {
  opponentStatus,
  proposalAnnouncement,
  proposalHeadline,
  secondsLeft,
  selfStatus,
} from "@/components/match-proposal/match-proposal-copy";

describe("the Match proposal's words", () => {
  test("each stage has the mock-up's title, the opponent's Handle in it", () => {
    expect(proposalHeadline("pending", "kaelis", false).title).toBe("Adversaire trouvé !");
    expect(proposalHeadline("accepted", "kaelis", true)).toEqual({
      title: "Accepté",
      subtitle: "On attend la réponse de kaelis.",
    });
    expect(proposalHeadline("ready", "kaelis", true).title).toBe("C'est parti !");
    expect(proposalHeadline("missed", "kaelis", false).subtitle).toBe(
      "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu.",
    );
    expect(proposalHeadline("missed", "kaelis", true).subtitle).toMatch(/^kaelis n'a pas répondu/);
  });

  test("each player's chip follows their answer", () => {
    expect(selfStatus("pending", false)).toBe("turn");
    expect(selfStatus("accepted", true)).toBe("ready");
    expect(selfStatus("missed", false)).toBe("missed");
    expect(opponentStatus("pending", false)).toBe("thinking");
    expect(opponentStatus("pending", true)).toBe("ready");
    expect(opponentStatus("missed", false)).toBe("missed");
  });

  test("screen readers hear the opponent and the time to answer, then the outcome", () => {
    expect(proposalAnnouncement("pending", "kaelis")).toBe(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter",
    );
    expect(proposalAnnouncement("ready", "kaelis")).toMatch(/^C'est parti/);
  });

  test("the seconds left are whole, from 10 down to 0", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 7001)).toBe(3);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
    expect(secondsLeft(10_000, -500)).toBe(10);
  });
});
