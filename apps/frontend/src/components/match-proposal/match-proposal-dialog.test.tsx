import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
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
};

let now = 0;

const clock = () => now;

const pending: ProposalView = {
  stage: "pending",
  expiresAt: 10_000,
  opponent: { handle: "kaelis", image: null },
  selfRank: { tier: "or", division: 2, tp: 64, shielded: false },
  opponentRank: { placementsLeft: 3 },
  selfAccepted: false,
  opponentAccepted: false,
};

const at = (stage: ProposalStage, accepted: Partial<ProposalView> = {}): ProposalView => ({
  ...pending,
  stage,
  ...accepted,
});

const shown = (proposal: ProposalView) => {
  const queryClient = new QueryClient();
  const handlers = { onAccept: vi.fn(), onSearchAgain: vi.fn(), onSolo: vi.fn() };

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
  });

  test("Accepter or Entrée accepts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onAccept } = shown(pending);

    await user.click(await screen.findByRole("button", { name: /Accepter/ }));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await user.keyboard("{Enter}");
    expect(onAccept).toHaveBeenCalledTimes(2);
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
    const { onAccept } = shown(at("accepted", { selfAccepted: true, opponentAccepted: true }));

    expect(await screen.findByRole("dialog", { name: "Accepté" })).toHaveAccessibleDescription(
      "On attend la réponse de kaelis.",
    );
    expect(screen.getByText("En attente de kaelis…")).toBeInTheDocument();
    expect(screen.getAllByText("Prêt")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Accepter/ })).not.toBeInTheDocument();

    // Entrée does nothing anymore.
    await user.keyboard("{Enter}");
    expect(onAccept).not.toHaveBeenCalled();
  });

  test("accepted by both: « C'est parti ! », GO and Au Face-off", async () => {
    shown(at("ready", { selfAccepted: true, opponentAccepted: true }));

    expect(await screen.findByRole("dialog", { name: "C'est parti !" })).toBeInTheDocument();
    expect(screen.getByText("GO")).toHaveClass("text-win");
    expect(screen.getByText("Face-off")).toBeInTheDocument();
    expect(screen.getByText("Au Face-off")).toBeInTheDocument();
  });

  test("out of time: searching again or back to Solo", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onSearchAgain, onSolo } = shown(at("missed"));

    expect(await screen.findByRole("dialog", { name: "Temps écoulé" })).toBeInTheDocument();
    expect(screen.getAllByText("Pas de réponse")).toHaveLength(2);
    expect(screen.getByText("annulé")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Relancer la recherche" }));
    await user.click(screen.getByRole("button", { name: "Retour au Solo" }));
    expect(onSearchAgain).toHaveBeenCalledTimes(1);
    expect(onSolo).toHaveBeenCalledTimes(1);
  });
});
