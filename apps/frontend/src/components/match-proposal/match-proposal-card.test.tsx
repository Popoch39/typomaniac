import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { MatchProposalCard } from "@/components/match-proposal/match-proposal-card";
import { ClockContext } from "@/components/run/clock-context";
import type { ProposalStage, ProposalView } from "@/stores/duel-store";
import { useLocaleStore } from "@/stores/locale-store";

const me: Me = {
  id: "popoch-id",
  name: "Popoch",
  email: "popoch@example.com",
  image: null,
  handle: "popoch",
  rank: null,
  ornament: null,
  ornamentChoice: null,
};

let now = 0;

const clock = () => now;

const pending: ProposalView = {
  stage: "pending",
  expiresAt: 10_000,
  opponent: { handle: "kaelis", image: null, ornament: null },
  selfOrnament: "gold",
  selfRank: { tier: "gold", division: 2, tp: 64, shielded: false },
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
  queueLock: null,
  dodgeLock: null,
};

const at = (stage: ProposalStage, accepted: Partial<ProposalView> = {}): ProposalView => ({
  ...pending,
  stage,
  ...accepted,
});

const shown = (proposal: ProposalView) => {
  const queryClient = new QueryClient();

  const handlers = {
    onAccept: vi.fn(),
    onDecline: vi.fn(),
    onSearchAgain: vi.fn(),
    onSolo: vi.fn(),
  };

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  render(
    <QueryClientProvider client={queryClient}>
      <ClockContext value={clock}>
        <MatchProposalCard proposal={proposal} {...handlers} />
      </ClockContext>
    </QueryClientProvider>,
  );

  return handlers;
};

beforeEach(() => {
  now = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MatchProposalCard", () => {
  test("to answer: both players and their ranks, 10 seconds, Accepter le Duel and Refuser", () => {
    shown(pending);

    expect(screen.getByRole("region", { name: "Adversaire trouvé !" })).toBeInTheDocument();
    expect(screen.getByText("Accepte avant la fin du compte à rebours.")).toBeInTheDocument();
    expect(screen.getByText("(toi)")).toBeInTheDocument();
    expect(screen.getByText("kaelis")).toBeInTheDocument();
    expect(screen.getByText("Gold II")).toBeInTheDocument();
    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(screen.getByText("À toi de répondre")).toBeInTheDocument();
    expect(screen.getByText("Réfléchit…")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accepter le Duel Entrée" })).toBeInTheDocument();
    // No key declines: Refuser shows none.
    expect(screen.getByRole("button", { name: "Refuser" })).toBeInTheDocument();
    expect(screen.queryByText(/mmr/i)).not.toBeInTheDocument();
    // Declining would be free: no warning.
    expect(screen.queryByText(/Refuser bloquera/)).not.toBeInTheDocument();
  });

  test("when declining would lock the Queue, it says so by the buttons", () => {
    shown({ ...pending, dodgeLock: 300_000 });

    expect(screen.getByText("Refuser bloquera la Queue 5 min")).toBeInTheDocument();
  });

  test("once accepted, the warning is gone: there is nothing left to decline", () => {
    shown(at("accepted", { selfAccepted: true, dodgeLock: 300_000 }));

    expect(screen.getByRole("region", { name: "Accepté" })).toBeInTheDocument();
    expect(screen.queryByText(/Refuser bloquera/)).not.toBeInTheDocument();
  });

  test("each player's avatar wears their Ornament, none for one without", () => {
    shown({ ...pending, opponent: { ...pending.opponent, ornament: "diamond" } });

    expect(
      [...document.querySelectorAll('[data-ornament] use[href^="#tier-ornament-"]')].map((use) =>
        use.getAttribute("href"),
      ),
    ).toEqual(["#tier-ornament-gold", "#tier-ornament-diamond"]);

    cleanup();
    shown(pending);

    expect(document.querySelectorAll("[data-ornament]")).toHaveLength(1);
  });

  test("Accepter le Duel accepts, Refuser declines", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onAccept, onDecline } = shown(pending);

    await user.click(screen.getByRole("button", { name: /^Accepter le Duel/ }));
    await user.click(screen.getByRole("button", { name: "Refuser" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  test("the count and the ring turn to the alert in the last 3 seconds", async () => {
    shown(pending);

    now = 6500;
    await act(async () => vi.advanceTimersByTime(250));
    expect(screen.getByText("4")).not.toHaveClass("text-destructive");

    now = 7500;
    await act(async () => vi.advanceTimersByTime(250));
    expect(screen.getByText("3")).toHaveClass("text-destructive");
  });

  test("accepted: waiting for the opponent, who is shown ready once they accept", () => {
    shown(at("accepted", { selfAccepted: true, opponentAccepted: true }));

    expect(screen.getByRole("region", { name: "Accepté" })).toBeInTheDocument();
    expect(screen.getByText("On attend la réponse de kaelis.")).toBeInTheDocument();
    expect(screen.getByText("En attente de kaelis…")).toBeInTheDocument();
    expect(screen.getAllByText("Prêt")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Accepter/ })).not.toBeInTheDocument();
  });

  test("accepted by both: « C'est parti ! », GO and Au Face-off", () => {
    shown(at("ready", { selfAccepted: true, opponentAccepted: true }));

    expect(screen.getByRole("region", { name: "C'est parti !" })).toBeInTheDocument();
    expect(screen.getByText("GO")).toHaveClass("text-win");
    expect(screen.getByText("Face-off")).toBeInTheDocument();
    expect(screen.getByText("Au Face-off")).toBeInTheDocument();
  });

  test.each([
    ["declined", "Duel refusé", "Refusé"],
    ["missed", "Temps écoulé", "Pas de réponse"],
  ] as const)(
    "%s: out of the Queue, searching again or back to Solo",
    async (stage, title, chip) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { onSearchAgain, onSolo, onDecline } = shown(at(stage));

      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
      expect(screen.getByText(chip)).toBeInTheDocument();
      expect(screen.getByText("Remis en file")).toBeInTheDocument();
      expect(screen.getByText("–")).not.toHaveClass("text-destructive");
      expect(screen.getByText("annulé")).toBeInTheDocument();
      // A free Dodge: no Queue lock.
      expect(screen.queryByText(/Queue bloquée/)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Relancer la recherche" }));
      await user.click(screen.getByRole("button", { name: "Retour au Solo" }));
      expect(onSearchAgain).toHaveBeenCalledTimes(1);
      expect(onSolo).toHaveBeenCalledTimes(1);
      expect(onDecline).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["declined", "Duel refusé", "Tu as quitté la file. Aucun TP en jeu. Queue bloquée 5 min."],
    [
      "missed",
      "Temps écoulé",
      "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu. Queue bloquée 5 min.",
    ],
  ] as const)(
    "%s with a Queue lock: it says so, and searching again waits for its end",
    async (stage, title, subtitle) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const { onSearchAgain, onSolo } = shown(
        at(stage, { queueLock: { until: 300_000, duration: 300_000 } }),
      );

      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
      expect(screen.getByText(subtitle)).toBeInTheDocument();

      const searchAgain = screen.getByRole("button", { name: /Relancer la recherche/ });

      expect(searchAgain).toBeDisabled();
      expect(searchAgain).toHaveTextContent("5:00");

      // Back to Solo meanwhile, for a Run.
      await user.click(screen.getByRole("button", { name: "Retour au Solo" }));
      expect(onSolo).toHaveBeenCalledTimes(1);

      now = 299_001;
      await act(async () => vi.advanceTimersByTime(250));
      expect(searchAgain).toBeDisabled();
      expect(searchAgain).toHaveTextContent("0:01");

      now = 300_000;
      await act(async () => vi.advanceTimersByTime(250));
      expect(screen.getByRole("button", { name: "Relancer la recherche" })).toBeEnabled();
      await user.click(screen.getByRole("button", { name: "Relancer la recherche" }));
      expect(onSearchAgain).toHaveBeenCalledTimes(1);
    },
  );

  test.each([
    ["opponent-declined", "kaelis a refusé", "Refusé"],
    ["opponent-missed", "kaelis n'a pas répondu", "Pas de réponse"],
  ] as const)("%s: the search goes on, at once on demand", async (stage, title, chip) => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onSearchAgain } = shown(at(stage, { selfAccepted: true }));

    expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
    expect(
      screen.getByText("Tu gardes ta place en tête de file, la recherche reprend."),
    ).toBeInTheDocument();
    expect(screen.getByText(chip)).toBeInTheDocument();
    expect(screen.getByText("Prêt")).toBeInTheDocument();
    expect(screen.getByText("annulé")).toBeInTheDocument();
    expect(screen.getByText(/Reprise automatique dans/)).toHaveTextContent(
      "Reprise automatique dans 3 s",
    );

    await user.click(screen.getByRole("button", { name: "Reprendre la recherche" }));
    expect(onSearchAgain).toHaveBeenCalledTimes(1);
  });
});

describe("MatchProposalCard in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("to answer: both players and their ranks, the key shown", () => {
    shown({ ...pending, dodgeLock: 300_000 });

    expect(screen.getByRole("region", { name: "Opponent found!" })).toBeInTheDocument();
    expect(screen.getByText("Accept before the countdown runs out.")).toBeInTheDocument();
    expect(screen.getByText("(you)")).toBeInTheDocument();
    expect(screen.getByText("Placement · 3 Duels left")).toBeInTheDocument();
    expect(screen.getByText("Your turn")).toBeInTheDocument();
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
    expect(screen.getByText("seconds")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept the Duel Enter" })).toBeInTheDocument();
    expect(screen.getByText("Declining will lock the Queue for 5 min")).toBeInTheDocument();
  });

  test("the last second is counted as one", async () => {
    shown(pending);

    now = 9500;
    await act(async () => vi.advanceTimersByTime(250));
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  test("accepted, then accepted by both", () => {
    shown(at("accepted", { selfAccepted: true }));

    expect(screen.getByRole("region", { name: "Accepted" })).toBeInTheDocument();
    expect(screen.getByText("Waiting for kaelis…")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();

    cleanup();
    shown(at("ready", { selfAccepted: true, opponentAccepted: true }));

    expect(screen.getByRole("region", { name: "Let's go!" })).toBeInTheDocument();
    expect(screen.getByText("On to the Face-off")).toBeInTheDocument();
  });

  test("a Dodge that locked the Queue: out of it, searching again once the lock is over", () => {
    shown(at("declined", { queueLock: { until: 300_000, duration: 300_000 } }));

    expect(screen.getByRole("region", { name: "Duel declined" })).toBeInTheDocument();
    expect(
      screen.getByText("You left the Queue. No TP at stake. Queue locked for 5 min."),
    ).toBeInTheDocument();
    expect(screen.getByText("Declined")).toBeInTheDocument();
    expect(screen.getByText("Back in the Queue")).toBeInTheDocument();
    expect(screen.getByText("canceled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Solo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search again/ })).toHaveTextContent("5:00");
  });

  test("the opponent at fault: the search picks back up on its own", () => {
    shown(at("opponent-missed", { selfAccepted: true }));

    expect(screen.getByRole("region", { name: "kaelis didn't answer" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "You keep your spot at the front of the Queue, and the search picks back up.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("No answer")).toBeInTheDocument();
    expect(screen.getByText(/Resuming automatically in/)).toHaveTextContent(
      "Resuming automatically in 3 s",
    );
    expect(screen.getByRole("button", { name: "Resume search" })).toBeInTheDocument();
  });
});
