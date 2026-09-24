import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DuelEnded } from "@/components/duel/duel-ended";
import type { DuelEnding } from "@/stores/duel-store";

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

const ending = (duelId: string | null): DuelEnding => ({
  duelId,
  outcome: "draw",
  forfeit: false,
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
  opponent: { handle: "alan", image: null },
});

// The end screen on a router of its own: Revoir is a link.
const renderEnded = async (duelId: string | null) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <DuelEnded ending={ending(duelId)} /> }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByRole("button", { name: "Nouveau Duel" });
};

describe("DuelEnded", () => {
  test("Revoir opens the Replay of the Duel just played", async () => {
    await renderEnded("duel-1");

    // A link styled as a button: Base UI gives it the button role.
    expect(screen.getByRole("button", { name: "Revoir" })).toHaveAttribute("href", "/duels/duel-1");
  });

  test("a Duel that was not written has nothing to replay: no Revoir", async () => {
    await renderEnded(null);

    expect(screen.queryByRole("button", { name: "Revoir" })).toBeNull();
  });
});
