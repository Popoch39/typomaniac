import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { gsap } from "gsap";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type ReplayedDuel, replayedDuelQueryOptions } from "@/api/duel-history";
import type { FaceOffSound, FaceOffSounds } from "@/audio/face-off-sounds";
import { DuelEnded } from "@/components/duel/duel-ended";
import type { DuelRanked } from "@/components/duel/rank-change";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import type { DuelEnding } from "@/stores/duel-store";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

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

// What the end screen played.
let played: FaceOffSound[] = [];

const sounds: FaceOffSounds = {
  unlock: () => {},
  play: (sound) => {
    played.push(sound);
  },
};

beforeEach(() => {
  played = [];
  useFaceOffSoundStore.setState({ muted: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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
  // Strict Mode runs every effect twice: a sound played on mount must still play once.
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <FaceOffSoundsContext value={sounds}>
          <RouterProvider router={router} />
        </FaceOffSoundsContext>
      </QueryClientProvider>
    </StrictMode>,
  );
  await screen.findByRole("button", { name: "Nouveau Duel" });
};

const or = (division: 4 | 3 | 2 | 1, tp: number) => ({
  tier: "or" as const,
  division,
  tp,
  shielded: false,
});

const argentI = { tier: "argent" as const, division: 1 as const, tp: 90, shielded: false };

const orIv = { tier: "or" as const, division: 4 as const, tp: 15, shielded: true };

const intoOr = { tp: 25, previousRank: argentI, rank: orIv };

const intoMaitre = {
  tp: 30,
  previousRank: { tier: "diamant" as const, division: 1 as const, tp: 80, shielded: false },
  rank: { tier: "maitre" as const, tp: 10, shielded: true },
};

// The celebration's emblem: only seen, so found by the part its timeline animates.
const celebration = () => document.querySelector('[data-tier-up="emblem"]');

// The User prefers reduced motion: the celebration reads it when its timeline is built.
const reduceMotion = () =>
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    matches: media === "(prefers-reduced-motion: reduce)",
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }));

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

  test("a Duel into a new Tier celebrates it, with its sound once", async () => {
    await renderEnded(null, null, intoOr);

    const rank = screen.getByRole("region", { name: "Rang" });

    expect(celebration()).not.toBeNull();
    expect(rank).toHaveTextContent("Nouveau Tier : Or IV !");
    expect(rank).toHaveTextContent("+25 TP");
    expect(rank).toHaveTextContent("15 TP");
    expect(played).toEqual(["rank-up"]);
  });

  test("a Duel into Maître celebrates it", async () => {
    await renderEnded(null, null, intoMaitre);

    expect(celebration()).not.toBeNull();
    const rank = screen.getByRole("region", { name: "Rang" });

    expect(rank).toHaveTextContent("Nouveau Tier : Maître !");
    expect(rank).toHaveTextContent("+30 TP");
    expect(rank).toHaveTextContent("10 TP");
    expect(played).toEqual(["rank-up"]);
  });

  test("the celebration stays silent while the Face-off is muted", async () => {
    useFaceOffSoundStore.setState({ muted: true });

    await renderEnded(null, null, intoOr);

    expect(celebration()).not.toBeNull();
    expect(played).toEqual([]);
  });

  test("the emblem comes in, animated, and still under reduced motion", async () => {
    await renderEnded(null, null, intoOr);

    const moving = celebration();

    expect(moving === null ? [] : gsap.getTweensOf(moving)).not.toHaveLength(0);

    cleanup();
    reduceMotion();
    await renderEnded(null, null, intoOr);

    const still = celebration();

    expect(still === null ? null : gsap.getTweensOf(still)).toEqual([]);
    expect(still === null ? null : gsap.getProperty(still, "opacity")).toBe(1);
    expect(still === null ? null : gsap.getProperty(still, "scale")).toBe(1);
  });

  test.each([
    ["a move up a Division", { tp: 20, previousRank: or(3, 90), rank: or(2, 10) }],
    ["a demotion out of a Tier", { tp: -18, previousRank: or(4, 5), rank: argentI }],
    ["TP within the Division", { tp: 12, previousRank: or(3, 40), rank: or(3, 52) }],
    ["a Placement", { tp: null, previousRank: { placementsLeft: 3 }, rank: { placementsLeft: 2 } }],
    ["the last Placement", { tp: null, previousRank: { placementsLeft: 1 }, rank: orIv }],
  ])("no celebration for %s", async (_, ranked: DuelRanked) => {
    await renderEnded(null, null, ranked);

    expect(screen.getByRole("region", { name: "Rang" })).toBeInTheDocument();
    expect(celebration()).toBeNull();
    expect(played).toEqual([]);
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
