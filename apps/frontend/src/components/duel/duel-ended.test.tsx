import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { type ReplayedDuel, replayedDuelQueryOptions } from "@/api/duel-history";
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

const ending = (duelId: string | null, ranked: DuelEnding["ranked"] = null): DuelEnding => ({
  ranked,
  duelId,
  outcome: "draw",
  forfeit: false,
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
  opponent: { handle: "alan", image: null },
});

const player = (handle: string) => ({
  handle,
  image: null,
  result: noResult,
  pace: 50,
  score: noScore,
  keystrokes: [{ kind: "char" as const, char: "s", at: 100 }],
});

// The Duel just played, as written by the server.
const written: ReplayedDuel = {
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  startsAt: 0,
  endedAt: 30_000,
  outcome: "draw",
  forfeit: false,
  me: player("ada"),
  opponent: player("alan"),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// The end screen on a router of its own (Revoir is a link), the written Duel in the cache if given.
const renderEnded = async (
  duelId: string | null,
  cached: ReplayedDuel | null = null,
  ranked: DuelEnding["ranked"] = null,
) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  if (cached !== null) {
    queryClient.setQueryData(replayedDuelQueryOptions(cached.id).queryKey, cached);
  }

  const router = createRouter({
    routeTree: createRootRoute({ component: () => <DuelEnded ending={ending(duelId, ranked)} /> }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole("button", { name: "Nouveau Duel" });
};

describe("DuelEnded", () => {
  test("Revoir opens the Replay of the Duel just played", async () => {
    await renderEnded("duel-1", written);

    // A link styled as a button: Base UI gives it the button role.
    expect(screen.getByRole("button", { name: "Revoir" })).toHaveAttribute("href", "/duels/duel-1");
  });

  test("a written Duel shows its Duel chart", async () => {
    await renderEnded("duel-1", written);

    expect(await screen.findByRole("figure", { name: "Duel chart" })).toBeInTheDocument();
  });

  test("shows a loading state while the Duel loads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => {})),
    );

    await renderEnded("duel-1");

    expect(screen.getByRole("status", { name: "Chargement du Duel chart" })).toBeInTheDocument();
  });

  test("a Duel detail that fails to load leaves the end screen, without its Duel chart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    await renderEnded("duel-1");

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByRole("button", { name: "Nouveau Duel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoir" })).toBeInTheDocument();
    expect(screen.queryByRole("figure", { name: "Duel chart" })).toBeNull();
  });

  test("a ranked Duel shows the TP won and the rank after it", async () => {
    await renderEnded(null, null, {
      tp: 20,
      previousRank: { tier: "or", division: 3, tp: 90, shielded: false },
      rank: { tier: "or", division: 2, tp: 10, shielded: true },
    });

    const rank = screen.getByRole("region", { name: "Rang" });

    expect(rank).toHaveTextContent("+20 TP");
    expect(rank).toHaveTextContent("Promotion : Or II");
    expect(rank).toHaveTextContent("10 TP");
  });

  test("a lost ranked Duel shows the TP lost, and a demotion", async () => {
    await renderEnded(null, null, {
      tp: -18,
      previousRank: { tier: "or", division: 4, tp: 5, shielded: false },
      rank: { tier: "argent", division: 1, tp: 75, shielded: false },
    });

    const rank = screen.getByRole("region", { name: "Rang" });

    expect(rank).toHaveTextContent("−18 TP");
    expect(rank).toHaveTextContent("Descente en Argent I");
  });

  test("a Placement Duel shows the Placements left, the last one reveals the rank", async () => {
    await renderEnded(null, null, {
      tp: null,
      previousRank: { placementsLeft: 3 },
      rank: { placementsLeft: 2 },
    });

    expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent(
      "Placement : encore 2 Duels avant ton rang",
    );
  });

  test("the last Placement reveals the rank", async () => {
    await renderEnded(null, null, {
      tp: null,
      previousRank: { placementsLeft: 1 },
      rank: { tier: "bronze", division: 4, tp: 0, shielded: false },
    });

    expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent(
      "Placement terminé, ton rang :Bronze IV",
    );
  });

  test("an unranked Duel (a Challenge) shows no rank", async () => {
    await renderEnded(null);

    expect(screen.queryByRole("region", { name: "Rang" })).toBeNull();
  });

  test("a Duel that was not written: no Revoir, no Duel chart, no loading state", async () => {
    await renderEnded(null);

    expect(screen.queryByRole("button", { name: "Revoir" })).toBeNull();
    expect(screen.queryByRole("figure", { name: "Duel chart" })).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
