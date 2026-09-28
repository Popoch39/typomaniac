import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { MatchProposalDialog } from "@/components/match-proposal/match-proposal-dialog";
import { ClockContext } from "@/components/run/clock-context";
import type { ProposalStage, ProposalView } from "@/stores/duel-store";

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
  selfOrnament: "or",
  selfRank: { tier: "or", division: 2, tp: 64, shielded: false },
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
        <MatchProposalDialog proposal={proposal} {...handlers} />
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

describe("MatchProposalDialog", () => {
  test("to answer: both players and their ranks, 10 seconds, Accepter focused", async () => {
    shown(pending);

    expect(await screen.findByRole("dialog", { name: "Adversaire trouvé !" })).toBeInTheDocument();
    expect(screen.getByText("Duel classé · 30 s · anglais")).toBeInTheDocument();
    expect(screen.getByText("(toi)")).toBeInTheDocument();
    expect(screen.getByText("kaelis")).toBeInTheDocument();
    expect(screen.getByText("Or II")).toBeInTheDocument();
    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(screen.getByText("À toi de répondre")).toBeInTheDocument();
    expect(screen.getByText("Réfléchit…")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accepter/ })).toHaveFocus();
    expect(screen.queryByText(/mmr/i)).not.toBeInTheDocument();
    // Declining would be free: no warning.
    expect(screen.queryByText(/Refuser bloquera/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter",
    );
  });

  test("when declining would lock the Queue, it says so by the buttons, and is announced", async () => {
    shown({ ...pending, dodgeLock: 300_000 });

    await screen.findByRole("dialog", { name: "Adversaire trouvé !" });

    expect(screen.getByText("Refuser bloquera la Queue 5 min")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Adversaire trouvé : kaelis, 10 secondes pour accepter. Refuser bloquera la Queue 5 min",
    );
  });

  test("once accepted, the warning is gone: there is nothing left to decline", async () => {
    shown(at("accepted", { selfAccepted: true, dodgeLock: 300_000 }));

    await screen.findByRole("dialog", { name: "Accepté" });

    expect(screen.queryByText(/Refuser bloquera/)).not.toBeInTheDocument();
  });

  test("each player's avatar wears their Ornament, none for one without", async () => {
    shown({ ...pending, opponent: { ...pending.opponent, ornament: "diamant" } });

    await screen.findByRole("dialog", { name: "Adversaire trouvé !" });

    expect(
      [...document.querySelectorAll('[data-ornament] use[href^="#tier-ornament-"]')].map((use) =>
        use.getAttribute("href"),
      ),
    ).toEqual(["#tier-ornament-or", "#tier-ornament-diamant"]);

    cleanup();
    shown(pending);
    await screen.findByRole("dialog", { name: "Adversaire trouvé !" });

    expect(document.querySelectorAll("[data-ornament]")).toHaveLength(1);
  });

  test("Accepter or Entrée accepts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onAccept } = shown(pending);

    await user.click(await screen.findByRole("button", { name: /Accepter/ }));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await user.keyboard("{Enter}");
    expect(onAccept).toHaveBeenCalledTimes(2);
  });

  test("Refuser or Échap declines", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onDecline, onAccept } = shown(pending);

    await user.click(await screen.findByRole("button", { name: /Refuser/ }));
    expect(onDecline).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onDecline).toHaveBeenCalledTimes(2);
    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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

  test("accepted: waiting for the opponent, who is shown ready once they accept", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const { onAccept, onDecline } = shown(
      at("accepted", { selfAccepted: true, opponentAccepted: true }),
    );

    expect(await screen.findByRole("dialog", { name: "Accepté" })).toHaveAccessibleDescription(
      "On attend la réponse de kaelis.",
    );
    expect(screen.getByText("En attente de kaelis…")).toBeInTheDocument();
    expect(screen.getAllByText("Prêt")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Accepter/ })).not.toBeInTheDocument();

    // Entrée and Échap do nothing anymore.
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");
    expect(onAccept).not.toHaveBeenCalled();
    expect(onDecline).not.toHaveBeenCalled();
  });

  test("accepted by both: « C'est parti ! », GO and Au Face-off", async () => {
    shown(at("ready", { selfAccepted: true, opponentAccepted: true }));

    expect(await screen.findByRole("dialog", { name: "C'est parti !" })).toBeInTheDocument();
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

      expect(await screen.findByRole("dialog", { name: title })).toBeInTheDocument();
      expect(screen.getByText(chip)).toBeInTheDocument();
      expect(screen.getByText("Remis en file")).toBeInTheDocument();
      expect(screen.getByText("–")).not.toHaveClass("text-destructive");
      expect(screen.getByText("annulé")).toBeInTheDocument();
      // A free Dodge: no Queue lock.
      expect(screen.queryByText(/Queue bloquée/)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Relancer la recherche" }));
      await user.click(screen.getByRole("button", { name: "Retour au Solo" }));
      await user.keyboard("{Escape}");
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
    async (stage, title, description) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const { onSearchAgain, onSolo } = shown(
        at(stage, { queueLock: { until: 300_000, duration: 300_000 } }),
      );

      expect(await screen.findByRole("dialog", { name: title })).toHaveAccessibleDescription(
        description,
      );

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

    expect(await screen.findByRole("dialog", { name: title })).toHaveAccessibleDescription(
      "Tu gardes ta place en tête de file, la recherche reprend.",
    );
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
