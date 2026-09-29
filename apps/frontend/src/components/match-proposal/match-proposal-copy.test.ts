import { describe, expect, test } from "vitest";

import {
  dodgeWarning,
  opponentStatus,
  playerStatusLabel,
  proposalAnnouncement,
  proposalHeadline,
  proposalNotification,
  secondsLeft,
  selfStatus,
} from "@/components/match-proposal/match-proposal-copy";

describe("the Match proposal's words", () => {
  test("each stage has the mock-up's title, the opponent's Handle in it", () => {
    expect(proposalHeadline("pending", "kaelis", "fr").title).toBe("Adversaire trouvé !");
    expect(proposalHeadline("accepted", "kaelis", "fr")).toEqual({
      title: "Accepté",
      subtitle: "On attend la réponse de kaelis.",
    });
    expect(proposalHeadline("ready", "kaelis", "fr").title).toBe("C'est parti !");
    expect(proposalHeadline("declined", "kaelis", "fr")).toEqual({
      title: "Duel refusé",
      subtitle: "Tu as quitté la file. Aucun TP en jeu.",
    });
    expect(proposalHeadline("missed", "kaelis", "fr")).toEqual({
      title: "Temps écoulé",
      subtitle: "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu.",
    });
    expect(proposalHeadline("opponent-declined", "kaelis", "fr")).toEqual({
      title: "kaelis a refusé",
      subtitle: "Tu gardes ta place en tête de file, la recherche reprend.",
    });
    expect(proposalHeadline("opponent-missed", "kaelis", "fr")).toEqual({
      title: "kaelis n'a pas répondu",
      subtitle: "Tu gardes ta place en tête de file, la recherche reprend.",
    });
  });

  test("a Dodge that locked the Queue says it, still with no TP at stake", () => {
    const queueLock = { until: 60_000, duration: 60_000 };

    expect(proposalHeadline("declined", "kaelis", "fr", queueLock).subtitle).toBe(
      "Tu as quitté la file. Aucun TP en jeu. Queue bloquée 1 min.",
    );
    expect(proposalHeadline("missed", "kaelis", "fr", queueLock).subtitle).toBe(
      "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu. Queue bloquée 1 min.",
    );
    expect(proposalAnnouncement("declined", "kaelis", "fr", { queueLock })).toBe(
      "Duel refusé, tu as quitté la file. Queue bloquée 1 min.",
    );
    expect(proposalAnnouncement("missed", "kaelis", "fr", { queueLock })).toBe(
      "Temps écoulé, tu as quitté la file. Queue bloquée 1 min.",
    );
  });

  test("a Dodge that would lock the Queue is warned of, its exact length said", () => {
    expect(dodgeWarning(60_000, "fr")).toBe("Refuser bloquera la Queue 1 min");
    expect(dodgeWarning(300_000, "fr")).toBe("Refuser bloquera la Queue 5 min");
    expect(dodgeWarning(900_000, "fr")).toBe("Refuser bloquera la Queue 15 min");
    expect(proposalAnnouncement("pending", "kaelis", "fr", { dodgeLock: 300_000 })).toBe(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter. Refuser bloquera la Queue 5 min",
    );
    // Once answered, there is nothing left to decline.
    expect(proposalAnnouncement("accepted", "kaelis", "fr", { dodgeLock: 300_000 })).toBe(
      "Accepté, on attend la réponse de kaelis",
    );
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
    expect(proposalAnnouncement("pending", "kaelis", "fr")).toBe(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter",
    );
    expect(proposalAnnouncement("ready", "kaelis", "fr")).toMatch(/^C'est parti/);
    expect(proposalAnnouncement("declined", "kaelis", "fr")).toBe(
      "Duel refusé, tu as quitté la file.",
    );
    expect(proposalAnnouncement("opponent-missed", "kaelis", "fr")).toBe(
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

describe("the Match proposal's words in English", () => {
  const queueLock = { until: 300_000, duration: 300_000 };

  test("each stage has its title and the line under it", () => {
    expect(
      (["pending", "accepted", "ready", "opponent-declined", "opponent-missed"] as const).map(
        (stage) => proposalHeadline(stage, "kaelis", "en"),
      ),
    ).toEqual([
      { title: "Opponent found!", subtitle: "Accept before the countdown runs out." },
      { title: "Accepted", subtitle: "Waiting for kaelis to answer." },
      { title: "Let's go!", subtitle: "You both accepted. The Face-off is starting." },
      {
        title: "kaelis declined",
        subtitle: "You keep your spot at the front of the Queue, and the search picks back up.",
      },
      {
        title: "kaelis didn't answer",
        subtitle: "You keep your spot at the front of the Queue, and the search picks back up.",
      },
    ]);
  });

  test("a Dodge says it left the Queue, and the Queue lock it imposed", () => {
    expect(proposalHeadline("declined", "kaelis", "en", queueLock)).toEqual({
      title: "Duel declined",
      subtitle: "You left the Queue. No TP at stake. Queue locked for 5 min.",
    });
    expect(proposalHeadline("missed", "kaelis", "en")).toEqual({
      title: "Time's up",
      subtitle: "You didn't answer in time, so you left the Queue. No TP at stake.",
    });
    expect(dodgeWarning(300_000, "en")).toBe("Declining will lock the Queue for 5 min");
  });

  test("screen readers hear it all in English", () => {
    expect(proposalAnnouncement("pending", "kaelis", "en", { dodgeLock: 300_000 })).toBe(
      "Opponent found: kaelis, 10 seconds to accept. Declining will lock the Queue for 5 min",
    );
    expect(
      (["accepted", "ready", "opponent-declined", "opponent-missed"] as const).map((stage) =>
        proposalAnnouncement(stage, "kaelis", "en"),
      ),
    ).toEqual([
      "Accepted, waiting for kaelis to answer",
      "Let's go! The Face-off is starting.",
      "kaelis declined, the search picks back up.",
      "kaelis didn't answer, the search picks back up.",
    ]);
    expect(proposalAnnouncement("declined", "kaelis", "en", { queueLock })).toBe(
      "Duel declined, you left the Queue. Queue locked for 5 min.",
    );
    expect(proposalAnnouncement("missed", "kaelis", "en")).toBe("Time's up, you left the Queue.");
  });

  test("each chip and the notification", () => {
    expect(
      (["turn", "ready", "thinking", "declined", "missed", "requeued"] as const).map((status) =>
        playerStatusLabel(status, "en"),
      ),
    ).toEqual(["Your turn", "Ready", "Thinking…", "Declined", "No answer", "Back in the Queue"]);
    expect(proposalNotification("kaelis", "en")).toEqual({
      title: "Opponent found",
      body: "kaelis is waiting: 10 seconds to accept.",
    });
  });
});
