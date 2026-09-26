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
    expect(proposalHeadline("pending", "kaelis").title).toBe("Adversaire trouvé !");
    expect(proposalHeadline("accepted", "kaelis")).toEqual({
      title: "Accepté",
      subtitle: "On attend la réponse de kaelis.",
    });
    expect(proposalHeadline("ready", "kaelis").title).toBe("C'est parti !");
    expect(proposalHeadline("declined", "kaelis")).toEqual({
      title: "Duel refusé",
      subtitle: "Tu as quitté la file. Aucun TP en jeu.",
    });
    expect(proposalHeadline("missed", "kaelis")).toEqual({
      title: "Temps écoulé",
      subtitle: "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu.",
    });
    expect(proposalHeadline("opponent-declined", "kaelis")).toEqual({
      title: "kaelis a refusé",
      subtitle: "Tu gardes ta place en tête de file, la recherche reprend.",
    });
    expect(proposalHeadline("opponent-missed", "kaelis")).toEqual({
      title: "kaelis n'a pas répondu",
      subtitle: "Tu gardes ta place en tête de file, la recherche reprend.",
    });
  });

  test("each player's chip follows their answer", () => {
    expect(selfStatus("pending", false)).toBe("turn");
    expect(selfStatus("accepted", true)).toBe("ready");
    expect(selfStatus("declined", false)).toBe("declined");
    expect(selfStatus("missed", false)).toBe("missed");
    expect(opponentStatus("pending", false)).toBe("thinking");
    expect(opponentStatus("pending", true)).toBe("ready");
  });

  test("once it ends without a Duel, whoever is at fault is out, the other back in the Queue", () => {
    expect(opponentStatus("declined", false)).toBe("requeued");
    expect(opponentStatus("missed", true)).toBe("requeued");
    expect(opponentStatus("opponent-declined", false)).toBe("declined");
    expect(opponentStatus("opponent-missed", false)).toBe("missed");
    // The User stays ready if they had accepted.
    expect(selfStatus("opponent-declined", true)).toBe("ready");
    expect(selfStatus("opponent-missed", false)).toBe("requeued");
  });

  test("screen readers hear the opponent and the time to answer, then the outcome", () => {
    expect(proposalAnnouncement("pending", "kaelis")).toBe(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter",
    );
    expect(proposalAnnouncement("ready", "kaelis")).toMatch(/^C'est parti/);
    expect(proposalAnnouncement("declined", "kaelis")).toBe("Duel refusé, tu as quitté la file.");
    expect(proposalAnnouncement("opponent-missed", "kaelis")).toBe(
      "kaelis n'a pas répondu, la recherche reprend.",
    );
  });

  test("the seconds left are whole, from 10 down to 0", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 7001)).toBe(3);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
    expect(secondsLeft(10_000, -500)).toBe(10);
  });
});
