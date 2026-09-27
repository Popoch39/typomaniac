import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { gsap } from "gsap";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type ReplayedDuel, replayedDuelQueryOptions } from "@/api/duel-history";
import type { FaceOffSound, FaceOffSounds } from "@/audio/face-off-sounds";
import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import { DuelEnded } from "@/components/duel/duel-ended";
import type { DuelRanked } from "@/components/duel/rank-change";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { stageScale } from "@/components/tier-up/stage/stage-scale";
import type { AuraRuntime } from "@/lib/aura-runtime";
import type { DuelEnding } from "@/stores/duel-store";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";
import { fakeAuraRuntime } from "@/test/fake-aura-runtime";
import { holdGsapClock } from "@/test/gsap-clock";

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

// GSAP's clock, moved by the tests: the Tier-up only plays as far as they say.
let clock = holdGsapClock();

beforeEach(() => {
  played = [];
  useFaceOffSoundStore.setState({ muted: false });
  clock = holdGsapClock();
});

afterEach(() => {
  clock.release();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type RenderOptions = {
  duelId?: string | null;
  cached?: ReplayedDuel | null;
  ranked?: DuelEnding["ranked"];
  aura?: AuraRuntime;
};

// The end screen on a router of its own (Revoir is a link), the written Duel in the cache if given.
const renderEnded = async ({
  duelId = null,
  cached = null,
  ranked = null,
  aura = fakeAuraRuntime().runtime,
}: RenderOptions = {}) => {
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
          <AuraRuntimeContext value={aura}>
            <RouterProvider router={router} />
          </AuraRuntimeContext>
        </FaceOffSoundsContext>
      </QueryClientProvider>
    </StrictMode>,
  );
  // Found by its text: behind a Tier-up, the end screen is out of reach.
  await screen.findByText("Nouveau Duel");
};

const standing = <T extends DuelRanked["rank"]>(rank: T) => rank;

const or = (division: 4 | 3 | 2 | 1, tp: number) => ({
  tier: "or" as const,
  division,
  tp,
  shielded: false,
});

const argentI = standing({ tier: "argent", division: 1, tp: 90, shielded: false });

const orIv = standing({ tier: "or", division: 4, tp: 15, shielded: true });

const intoOr = { tp: 25, previousRank: argentI, rank: orIv };

const intoBronze = {
  tp: 28,
  previousRank: standing({ tier: "fer", division: 1, tp: 85, shielded: false }),
  rank: standing({ tier: "bronze", division: 4, tp: 13, shielded: true }),
};

const intoArgent = {
  tp: 26,
  previousRank: standing({ tier: "bronze", division: 1, tp: 88, shielded: false }),
  rank: standing({ tier: "argent", division: 4, tp: 14, shielded: true }),
};

const intoPlatine = {
  tp: 27,
  previousRank: standing({ tier: "or", division: 1, tp: 86, shielded: false }),
  rank: standing({ tier: "platine", division: 4, tp: 13, shielded: true }),
};

const intoDiamant = {
  tp: 29,
  previousRank: standing({ tier: "platine", division: 1, tp: 84, shielded: false }),
  rank: standing({ tier: "diamant", division: 4, tp: 13, shielded: true }),
};

const intoManiac = {
  tp: 30,
  previousRank: standing({ tier: "diamant", division: 1, tp: 80, shielded: false }),
  rank: standing({ tier: "maniac", tp: 10, shielded: true }),
};

// The Emblem a Blason in this part carries, or null without one: only one Blason there.
const blasonOf = (part: HTMLElement) => {
  const blasons = part.querySelectorAll("[data-tier-blason]");

  expect(blasons.length).toBeLessThanOrEqual(1);

  return blasons[0]?.querySelector('use[href^="#tier-emblem"]')?.getAttribute("href") ?? null;
};

// The Tier whose Emblem the Tier-up brings in, drawn in layers of its own.
const emblemReached = (tierUp: HTMLElement) =>
  tierUp.querySelector("[data-tier-up=emblem]")?.getAttribute("data-tier") ?? null;

// How much of a traced line is still to draw, as the browser renders it: 1 for none of it, 0
// for all of it (the path's length set to 1).
const drawn = (path: Element | null) => Number(path?.getAttribute("stroke-dashoffset"));

// The Emblem drawn on its own in this part.
const emblemOf = (part: HTMLElement) =>
  part.querySelector("[data-tier-emblem] use")?.getAttribute("href") ?? null;

// How visible each of these parts is, as GSAP left it.
const opacitiesOf = (parts: Element[]) => parts.map((piece) => gsap.getProperty(piece, "opacity"));

const continueButton = () => screen.getByRole("button", { name: "Continuer" });

// The end screen itself, which the focus comes back to once the Tier-up is closed.
const endScreen = () => screen.getByText("Nouveau Duel").closest("[tabindex='-1']");

// The User prefers reduced motion: the Tier-up reads it as it opens.
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

// The ways to go through the Tier-up: once to skip to its end, once more to close it.
const ACTIONS = {
  click: () => userEvent.click(screen.getByRole("dialog")),
  Escape: () => userEvent.keyboard("{Escape}"),
  Enter: () => userEvent.keyboard("{Enter}"),
};

describe("DuelEnded", () => {
  test("Revoir opens the Replay of the Duel just played", async () => {
    await renderEnded({ duelId: "duel-1", cached: written });

    // A link styled as a button: Base UI gives it the button role.
    expect(screen.getByRole("button", { name: "Revoir" })).toHaveAttribute("href", "/duels/duel-1");
  });

  test("a written Duel shows its Duel chart", async () => {
    await renderEnded({ duelId: "duel-1", cached: written });

    expect(await screen.findByRole("figure", { name: "Duel chart" })).toBeInTheDocument();
  });

  test("shows a loading state while the Duel loads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => {})),
    );

    await renderEnded({ duelId: "duel-1" });

    expect(screen.getByRole("status", { name: "Chargement du Duel chart" })).toBeInTheDocument();
  });

  test("a Duel detail that fails to load leaves the end screen, without its Duel chart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    await renderEnded({ duelId: "duel-1" });

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByRole("button", { name: "Nouveau Duel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoir" })).toBeInTheDocument();
    expect(screen.queryByRole("figure", { name: "Duel chart" })).toBeNull();
  });

  test("a ranked Duel shows the TP won and the rank after it", async () => {
    await renderEnded({
      ranked: {
        tp: 20,
        previousRank: { tier: "or", division: 3, tp: 90, shielded: false },
        rank: { tier: "or", division: 2, tp: 10, shielded: true },
      },
    });

    const rank = screen.getByRole("region", { name: "Rang" });

    expect(rank).toHaveTextContent("+20 TP");
    expect(rank).toHaveTextContent("Promotion : Or II");
    expect(rank).toHaveTextContent("10 TP");
    expect(blasonOf(rank)).toBe("#tier-emblem-or");
  });

  test("a lost ranked Duel shows the TP lost, and a demotion", async () => {
    await renderEnded({
      ranked: {
        tp: -18,
        previousRank: { tier: "or", division: 4, tp: 5, shielded: false },
        rank: { tier: "argent", division: 1, tp: 75, shielded: false },
      },
    });

    const rank = screen.getByRole("region", { name: "Rang" });

    expect(rank).toHaveTextContent("−18 TP");
    expect(rank).toHaveTextContent("Descente en Argent I");
  });

  test("a Placement Duel shows the Placements left, the last one reveals the rank", async () => {
    await renderEnded({
      ranked: { tp: null, previousRank: { placementsLeft: 3 }, rank: { placementsLeft: 2 } },
    });

    expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent(
      "Placement : encore 2 Duels avant ton rang",
    );
    expect(blasonOf(screen.getByRole("region", { name: "Rang" }))).toBeNull();
  });

  test("the last Placement reveals the rank", async () => {
    await renderEnded({
      ranked: {
        tp: null,
        previousRank: { placementsLeft: 1 },
        rank: { tier: "bronze", division: 4, tp: 0, shielded: false },
      },
    });

    expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent(
      "Placement terminé, ton rang :Bronze IV",
    );
    expect(blasonOf(screen.getByRole("region", { name: "Rang" }))).toBe("#tier-emblem-bronze");
  });

  test("an unranked Duel (a Challenge) shows no rank, and no Tier-up", async () => {
    await renderEnded();

    expect(screen.queryByRole("region", { name: "Rang" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("a Duel that was not written: no Revoir, no Duel chart, no loading state", async () => {
    await renderEnded();

    expect(screen.queryByRole("button", { name: "Revoir" })).toBeNull();
    expect(screen.queryByRole("figure", { name: "Duel chart" })).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("the Tier-up", () => {
  test("a Duel into a new Tier opens it, named by the Tier, all its text there at once", async () => {
    await renderEnded({ ranked: intoOr });

    const tierUp = screen.getByRole("dialog", { name: "Or" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Argent I → Or IV");
    expect(within(tierUp).getByRole("button", { name: "Continuer" })).toBeInTheDocument();
    expect(emblemOf(tierUp)).toBe("#tier-emblem-argent");
    expect(emblemReached(tierUp)).toBe("or");
  });

  test("leaves the end screen behind it out of reach", async () => {
    await renderEnded({ ranked: intoOr });

    expect(screen.getByRole("dialog", { name: "Or" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nouveau Duel" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Rang" })).toBeNull();
  });

  test("scales its stage to fit the window whole", async () => {
    await renderEnded({ ranked: intoOr });

    const stage = screen.getByRole("dialog").querySelector("[data-tier-up=stage]");
    const scale = stageScale(window.innerWidth, window.innerHeight);

    expect(stage).toHaveStyle({ transform: `translate(-50%, -50%) scale(${scale})` });
  });

  test("a Duel into Maniac opens it, as the ultimate Tier", async () => {
    await renderEnded({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog", { name: "Maniac" });

    expect(tierUp).toHaveTextContent("Palier ultime");
    expect(tierUp).toHaveTextContent("Diamant I → Maniac");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-diamant");
    expect(emblemReached(tierUp)).toBe("maniac");
  });

  test.each([
    ["a move up a Division", { tp: 20, previousRank: or(3, 90), rank: or(2, 10) }],
    ["a demotion out of a Tier", { tp: -18, previousRank: or(4, 5), rank: argentI }],
    ["TP within the Division", { tp: 12, previousRank: or(3, 40), rank: or(3, 52) }],
    ["a Placement", { tp: null, previousRank: { placementsLeft: 3 }, rank: { placementsLeft: 2 } }],
    ["the last Placement", { tp: null, previousRank: { placementsLeft: 1 }, rank: orIv }],
  ])("does not open for %s", async (_, ranked: DuelRanked) => {
    await renderEnded({ ranked });
    await clock.advance(5);

    expect(screen.getByRole("region", { name: "Rang" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(played).toEqual([]);
  });

  test("Fer → Bronze sounds as the iron comes apart, as the Blason lands, then with the name", async () => {
    await renderEnded({ ranked: intoBronze });

    await clock.advance(0.9);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-bronze-dissolve"]);

    await clock.advance(1.3);
    expect(played).toEqual(["tier-up-bronze-dissolve", "tier-up-bronze-impact"]);

    await clock.advance(0.4);
    expect(played).toEqual([
      "tier-up-bronze-dissolve",
      "tier-up-bronze-impact",
      "tier-up-bronze-name",
    ]);

    await clock.advance(5);
    expect(played).toHaveLength(3);
  });

  test("a Duel into Argent opens it, the bronze Emblem there to split", async () => {
    await renderEnded({ ranked: intoArgent });

    const tierUp = screen.getByRole("dialog", { name: "Argent" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Bronze I → Argent IV");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-bronze");
    expect(emblemReached(tierUp)).toBe("argent");
  });

  test("Bronze → Argent sounds as the bronze cracks, as the Argent strikes, then with the name", async () => {
    await renderEnded({ ranked: intoArgent });

    await clock.advance(0.8);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-argent-crack"]);

    await clock.advance(1);
    expect(played).toEqual(["tier-up-argent-crack", "tier-up-argent-impact"]);

    // Each chevron stamped in, then the name.
    await clock.advance(0.7);
    expect(played).toEqual([
      "tier-up-argent-crack",
      "tier-up-argent-impact",
      "tier-up-argent-stamp",
      "tier-up-argent-stamp",
      "tier-up-argent-name",
    ]);

    // The light sweeping over the metal.
    await clock.advance(0.3);
    expect(played.at(-1)).toBe("tier-up-argent-sweep");

    await clock.advance(0.9);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.1);
    expect(continueButton()).toHaveFocus();
    expect(played).toHaveLength(6);
  });

  test("Bronze → Argent skipped as it strikes: no chevron, sweep nor name heard after", async () => {
    await renderEnded({ ranked: intoArgent });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.1);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-argent-crack", "tier-up-argent-impact"]);
  });

  test("Argent → Or sounds as the silver ascends, as the Or materializes, then with the name", async () => {
    await renderEnded({ ranked: intoOr });

    await clock.advance(0.7);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-or-ascend"]);

    await clock.advance(1);
    expect(played).toEqual(["tier-up-or-ascend"]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-or-ascend", "tier-up-or-materialize"]);

    await clock.advance(0.6);
    expect(played).toEqual(["tier-up-or-ascend", "tier-up-or-materialize", "tier-up-or-name"]);

    await clock.advance(1);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(3);
  });

  test("Argent → Or skipped as it materializes: no name heard after", async () => {
    await renderEnded({ ranked: intoOr });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.1);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-or-ascend", "tier-up-or-materialize"]);
  });

  test("Argent → Or traces its laurels and its star, little by little, once it has materialized", async () => {
    await renderEnded({ ranked: intoOr });

    const tierUp = screen.getByRole("dialog");
    const laurel = tierUp.querySelector("[data-tier-up=laurel] path");
    const star = tierUp.querySelector("[data-tier-up=star-trace]");

    await clock.advance(2);
    expect(drawn(laurel)).toBe(1);
    expect(drawn(star)).toBe(1);

    await clock.advance(0.35);
    expect(drawn(star)).toBeGreaterThan(0.05);
    expect(drawn(star)).toBeLessThan(0.95);
    expect(drawn(laurel)).toBeGreaterThan(0.05);
    expect(drawn(laurel)).toBeLessThan(0.95);

    await clock.advance(0.6);
    expect(drawn(star)).toBe(0);
    expect(drawn(laurel)).toBe(0);
  });

  test("Argent → Or pops its leaves in pair by pair, none seen before", async () => {
    await renderEnded({ ranked: intoOr });

    const leaves = [...screen.getByRole("dialog").querySelectorAll("[data-tier-up^=leaf-]")];
    const opacities = () => leaves.map((leaf) => gsap.getProperty(leaf, "opacity"));

    expect(leaves).toHaveLength(14);

    await clock.advance(2.3);
    expect(opacities()).toEqual(Array(14).fill(0));

    await clock.advance(0.2);
    expect(opacities()[0]).toBeGreaterThan(0);
    expect(opacities()[13]).toBe(0);

    await clock.advance(1);
    expect(opacities()).toEqual(Array(14).fill(1));
  });

  test("a Duel into Platine opens it, the Or Emblem there to turn over", async () => {
    await renderEnded({ ranked: intoPlatine });

    const tierUp = screen.getByRole("dialog", { name: "Platine" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Or I → Platine IV");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-or");
    expect(emblemReached(tierUp)).toBe("platine");
  });

  test("Or → Platine sounds as the gold turns over, as the Platine assembles, then with the name", async () => {
    await renderEnded({ ranked: intoPlatine });

    await clock.advance(0.8);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-platine-flip"]);

    await clock.advance(1.2);
    expect(played).toEqual(["tier-up-platine-flip"]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-platine-flip", "tier-up-platine-assemble"]);

    await clock.advance(0.4);
    expect(played).toEqual([
      "tier-up-platine-flip",
      "tier-up-platine-assemble",
      "tier-up-platine-name",
    ]);

    await clock.advance(1.2);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(3);
  });

  test("Or → Platine skipped as it assembles: no name heard after", async () => {
    await renderEnded({ ranked: intoPlatine });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.4);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-platine-flip", "tier-up-platine-assemble"]);
  });

  test("Or → Platine assembles its hexagon triangle by triangle, whole at the impact", async () => {
    await renderEnded({ ranked: intoPlatine });

    const triangles = [...screen.getByRole("dialog").querySelectorAll("[data-tier-up=triangle]")];
    const opacities = () => triangles.map((triangle) => gsap.getProperty(triangle, "opacity"));

    expect(triangles).toHaveLength(6);

    await clock.advance(1.45);
    expect(opacities()).toEqual(Array(6).fill(0));

    await clock.advance(0.4);
    expect(opacities()[0]).toBeGreaterThan(0);
    expect(opacities()[5]).toBe(0);
    expect(triangles.map((triangle) => gsap.getProperty(triangle, "x"))[0]).not.toBe(0);

    await clock.advance(0.5);
    expect(opacities()).toEqual(Array(6).fill(1));
    expect(triangles.map((triangle) => gsap.getProperty(triangle, "x"))).toEqual(Array(6).fill(0));
  });

  test.each([
    ["Argent → Or", intoOr, "#5c3f06"],
    ["Or → Platine", intoPlatine, "#134a42"],
  ])(
    "%s cuts its star in the metal, never in solid ink",
    async (_, ranked: DuelRanked, outline) => {
      await renderEnded({ ranked });
      await clock.advance(5);

      const star = [
        ...screen
          .getByRole("dialog")
          .querySelectorAll('[data-tier-up=engraving] use[href="#tier-star"]'),
      ];

      // Cut in the dark of its own metal over a light lip, as the artboards draw it; each layer
      // keeps its own opacity: the timeline fades the star in whole, never a layer up to full.
      expect(star).toHaveLength(2);
      expect(star.map((layer) => layer.getAttribute("fill"))).toEqual(["#fff", outline]);
      expect(star.map((layer) => layer.getAttribute("opacity"))).toEqual(["0.38", "0.75"]);
      expect(
        star.map((layer) => (layer instanceof SVGElement ? layer.style.opacity : null)),
      ).toEqual(["", ""]);
      expect(opacitiesOf(star.map((layer) => layer.parentElement ?? layer))).toEqual([1, 1]);
    },
  );

  test("Or → Platine pops its studs in one by one, then unfurls its wings, none seen before", async () => {
    await renderEnded({ ranked: intoPlatine });

    const tierUp = screen.getByRole("dialog");
    const studs = [...tierUp.querySelectorAll("[data-tier-up=engraving] > circle")];
    const feathers = [...tierUp.querySelectorAll("[data-tier-up=feather]")];

    expect(studs).toHaveLength(6);
    expect(feathers).toHaveLength(6);

    await clock.advance(2.35);
    expect(opacitiesOf(studs)).toEqual(Array(6).fill(0));
    expect(opacitiesOf(feathers)).toEqual(Array(6).fill(0));

    await clock.advance(0.25);
    expect(opacitiesOf(studs)[0]).toBeGreaterThan(0);
    expect(opacitiesOf(studs)[5]).toBe(0);
    expect(opacitiesOf(feathers).some((opacity) => Number(opacity) > 0)).toBe(true);

    await clock.advance(0.8);
    expect(opacitiesOf(studs)).toEqual(Array(6).fill(1));
    expect(opacitiesOf(feathers)).toEqual(Array(6).fill(1));
  });

  test("a Duel into Diamant opens it, the Platine Emblem there to implode", async () => {
    await renderEnded({ ranked: intoDiamant });

    const tierUp = screen.getByRole("dialog", { name: "Diamant" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Platine I → Diamant IV");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-platine");
    expect(emblemReached(tierUp)).toBe("diamant");
  });

  test("Platine → Diamant sounds as the Platine implodes, as its facets converge, as the gem slams down, then with the name", async () => {
    await renderEnded({ ranked: intoDiamant });

    await clock.advance(0.7);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-diamant-implode"]);

    await clock.advance(1.3);
    expect(played).toEqual(["tier-up-diamant-implode", "tier-up-diamant-converge"]);

    await clock.advance(1.5);
    expect(played).toHaveLength(2);

    await clock.advance(0.2);
    expect(played).toEqual([
      "tier-up-diamant-implode",
      "tier-up-diamant-converge",
      "tier-up-diamant-slam",
    ]);

    await clock.advance(0.1);
    expect(played.at(-1)).toBe("tier-up-diamant-name");

    await clock.advance(1.2);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(4);
  });

  test("Platine → Diamant skipped as its facets converge: no slam nor name heard after", async () => {
    await renderEnded({ ranked: intoDiamant });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.5);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-diamant-implode", "tier-up-diamant-converge"]);
  });

  test("Platine → Diamant cuts its gem facet by facet, all in place before it slams down", async () => {
    await renderEnded({ ranked: intoDiamant });

    const tierUp = screen.getByRole("dialog");
    const facets = [...tierUp.querySelectorAll("[data-tier-up=facet]")];
    const body = tierUp.querySelector("[data-tier-up=body]");

    expect(facets).toHaveLength(8);

    await clock.advance(2.05);
    expect(opacitiesOf(facets)).toEqual(Array(8).fill(0));

    await clock.advance(0.15);
    expect(opacitiesOf(facets)[0]).toBeGreaterThan(0);
    expect(opacitiesOf(facets)[7]).toBe(0);
    expect(gsap.getProperty(facets[0] ?? tierUp, "x")).not.toBe(0);

    await clock.advance(1.3);
    expect(opacitiesOf(facets)).toEqual(Array(8).fill(1));
    expect(facets.map((facet) => gsap.getProperty(facet, "x"))).toEqual(Array(8).fill(0));
    expect(gsap.getProperty(body, "opacity")).toBe(0);

    await clock.advance(0.4);
    expect(gsap.getProperty(body, "opacity")).toBe(1);
  });

  test("Platine → Diamant unfurls its wings feather by feather after the impact, none seen before", async () => {
    await renderEnded({ ranked: intoDiamant });

    const tierUp = screen.getByRole("dialog");
    const feathers = [...tierUp.querySelectorAll("[data-tier-up=feather]")];
    const crystals = [...tierUp.querySelectorAll("[data-tier-up=crystal]")];

    expect(feathers).toHaveLength(14);
    expect(crystals).toHaveLength(2);

    await clock.advance(3.8);
    expect(opacitiesOf([...feathers, ...crystals])).toEqual(Array(16).fill(0));

    await clock.advance(0.2);
    expect(opacitiesOf(feathers).some((opacity) => Number(opacity) > 0)).toBe(true);
    expect(opacitiesOf(feathers).some((opacity) => opacity === 0)).toBe(true);
    expect(opacitiesOf(crystals)).toEqual([0, 0]);

    await clock.advance(0.7);
    expect(opacitiesOf([...feathers, ...crystals])).toEqual(Array(16).fill(1));
  });

  test("Platine → Diamant slams its name down whole, its two ghosts gone once it has", async () => {
    await renderEnded({ ranked: intoDiamant });

    const tierUp = screen.getByRole("dialog");
    const name = tierUp.querySelector("[data-tier-up=name]");
    const ghosts = [...tierUp.querySelectorAll("[data-tier-up^=ghost-]")];
    const letters = [...tierUp.querySelectorAll("[data-tier-up=letter]")];

    expect(ghosts).toHaveLength(2);

    await clock.advance(3.9);
    expect(gsap.getProperty(name, "opacity")).toBe(0);
    expect(opacitiesOf(ghosts)).toEqual([0, 0]);

    await clock.advance(0.15);
    expect(gsap.getProperty(name, "opacity")).toBeGreaterThan(0);
    expect(opacitiesOf(ghosts).every((opacity) => Number(opacity) > 0)).toBe(true);

    await clock.advance(1);
    expect(gsap.getProperty(name, "opacity")).toBe(1);
    expect(opacitiesOf(letters)).toEqual(Array(7).fill(1));
    expect(opacitiesOf(ghosts)).toEqual([0, 0]);
  });

  test("gives the focus to « Continuer » once its intro is over", async () => {
    await renderEnded({ ranked: intoBronze });

    await clock.advance(3.5);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.6);
    expect(continueButton()).toHaveFocus();
  });

  test.each(Object.entries(ACTIONS))(
    "%s skips to its end without the sounds left, then closes it, back on the end screen",
    async (_, go) => {
      await renderEnded({ ranked: intoBronze });
      await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
      await clock.advance(1.5);

      await go();

      expect(continueButton()).toHaveFocus();
      await clock.advance(5);
      expect(played).toEqual(["tier-up-bronze-dissolve"]);
      expect(screen.getByRole("dialog", { name: "Bronze" })).toBeInTheDocument();

      await go();

      expect(screen.queryByRole("dialog")).toBeNull();
      await waitFor(() => expect(endScreen()).toHaveFocus());
      expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent("+28 TP");
      expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent(
        "Promotion : Bronze IV",
      );
    },
  );

  test("« Continuer » closes it, even before its end, and it never comes back", async () => {
    await renderEnded({ ranked: intoBronze });

    await userEvent.click(continueButton());

    expect(screen.queryByRole("dialog")).toBeNull();
    await clock.advance(10);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(played).toEqual([]);
  });

  test("stays silent while the Face-off is muted", async () => {
    useFaceOffSoundStore.setState({ muted: true });

    await renderEnded({ ranked: intoBronze });
    await clock.advance(6);

    expect(screen.getByRole("dialog", { name: "Bronze" })).toBeInTheDocument();
    expect(played).toEqual([]);
  });

  test("under reduced motion, opens still at its end, with the impact's sound alone", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoBronze });

    const tierUp = screen.getByRole("dialog", { name: "Bronze" });
    const parts = [...tierUp.querySelectorAll("[data-tier-up]")];

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(gsap.getProperty(continueButton(), "opacity")).toBe(1);
    expect(played).toEqual(["tier-up-bronze-impact"]);

    await clock.advance(6);

    expect(parts.flatMap((each) => gsap.getTweensOf(each)).some((tween) => tween.isActive())).toBe(
      false,
    );
    expect(played).toEqual(["tier-up-bronze-impact"]);

    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("brings its name into sight letter by letter, after the Blason lands", async () => {
    await renderEnded({ ranked: intoBronze });

    const letters = [...screen.getByRole("dialog").querySelectorAll("[data-tier-up=letter]")];
    const opacities = () => letters.map((letter) => gsap.getProperty(letter, "opacity"));

    expect(letters).toHaveLength(6);
    expect(opacities()).toEqual(Array(6).fill(0));

    await clock.advance(2.8);
    expect(opacities()[0]).toBeGreaterThan(0);
    expect(opacities()[5]).toBe(0);

    await clock.advance(1.5);
    expect(opacities()).toEqual(Array(6).fill(1));
  });

  test("traces the new Emblem's outline, then its engraving, little by little", async () => {
    await renderEnded({ ranked: intoBronze });

    const tierUp = screen.getByRole("dialog");
    const outline = tierUp.querySelector("[data-tier-up=outline]");
    const chevron = tierUp.querySelector("[data-tier-up=engraving] path");

    await clock.advance(1.6);
    expect(drawn(outline)).toBeGreaterThan(0.05);
    expect(drawn(outline)).toBeLessThan(0.95);

    await clock.advance(0.65);
    expect(drawn(outline)).toBe(0);
    expect(drawn(chevron)).toBeGreaterThan(0.05);
    expect(drawn(chevron)).toBeLessThan(0.95);
  });

  test("stops everything, sounds included, when the end screen goes", async () => {
    await renderEnded({ ranked: intoBronze });
    await clock.advance(0.5);

    cleanup();
    await clock.advance(5);

    expect(played).toEqual([]);
  });
});

// Once the full Aura's runtime has loaded and answered.
const settle = () => act(async () => {});

// The full Auras drawn and still held, by Tier.
const held = (browser: ReturnType<typeof fakeAuraRuntime>) =>
  browser.painters.flatMap((painter) => (painter.disposed ? [] : [painter.tier]));

describe("the Tier-up's Aura", () => {
  test("from Or, the Emblem lands in its full Aura, let go once the Tier-up is closed", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoOr, aura: browser.runtime });
    await settle();

    expect(held(browser)).toEqual(["or"]);

    await userEvent.click(continueButton());

    expect(held(browser)).toEqual([]);
  });

  test("Argent → Or lights its full Aura at the impact, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoOr, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(1.95);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.1);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(0.8);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["or"]);
  });

  test("under reduced motion, Argent → Or opens with its full Aura already lit", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoOr });

    const aura = screen.getByRole("dialog", { name: "Or" }).querySelector("[data-tier-up=aura]");

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(played).toEqual(["tier-up-or-materialize"]);
  });

  test("Or → Platine lights its full Aura at the impact, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoPlatine, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(2.25);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.1);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(0.8);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["platine"]);
  });

  test("under reduced motion, Or → Platine opens with its full Aura already lit", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoPlatine });

    const aura = screen
      .getByRole("dialog", { name: "Platine" })
      .querySelector("[data-tier-up=aura]");

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(played).toEqual(["tier-up-platine-assemble"]);
  });

  test("Platine → Diamant lights its full Aura at the impact, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoDiamant, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(3.75);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.1);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(0.8);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["diamant"]);
  });

  test("under reduced motion, Platine → Diamant opens with its gem, wings and full Aura in place, and its name", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoDiamant });

    const tierUp = screen.getByRole("dialog", { name: "Diamant" });

    const lit = [
      ...tierUp.querySelectorAll(
        "[data-tier-up=aura], [data-tier-up=body], [data-tier-up=feather], [data-tier-up=crystal], [data-tier-up=name]",
      ),
    ];

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(opacitiesOf(lit)).toEqual(Array(lit.length).fill(1));
    expect(played).toEqual(["tier-up-diamant-slam"]);
  });

  test("below Or, there is no full Aura to ask for", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoBronze, aura: browser.runtime });
    await settle();

    expect(browser.painters).toEqual([]);
  });

  test("refused, the Emblem lands without it", async () => {
    const browser = fakeAuraRuntime({ webgl2: false });

    await renderEnded({ ranked: intoOr, aura: browser.runtime });
    await settle();

    const tierUp = screen.getByRole("dialog", { name: "Or" });

    expect(tierUp.querySelector("[data-aura-canvas]")).toBeNull();
    expect(emblemReached(tierUp)).toBe("or");
  });
});
