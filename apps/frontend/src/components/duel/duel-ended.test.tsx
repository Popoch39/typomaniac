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
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from "vitest";

import { type ReplayedDuel, replayedDuelQueryOptions } from "@/api/duel-history";
import { type Me, meQueryOptions } from "@/api/me";
import type { FaceOffSound, FaceOffSounds } from "@/audio/face-off-sounds";
import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import { DuelEnded } from "@/components/duel/duel-ended";
import { forgetBandMorph, recordBandMorph } from "@/components/duel-end/band-morph";
import { type DuelRanked, rankChange, tierReached } from "@/components/duel/rank-change";
import { TIER_UP_AT } from "@/components/duel-end/use-duel-end-entrance";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { stageScale } from "@/components/tier-up/stage/stage-scale";
import type { AuraRuntime } from "@/lib/aura-runtime";
import type { DuelEnding } from "@/stores/duel-store";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlayStore } from "@/stores/play-store";
import { fakeAuraRuntime } from "@/test/fake-aura-runtime";
import { holdGsapClock } from "@/test/gsap-clock";
import { writtenDuelOf } from "@/test/written-duel";

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

// How the Duel ended for this User: a Draw unless a test says otherwise.
type Issue = Pick<DuelEnding, "outcome" | "forfeit">;

const DRAW: Issue = { outcome: "draw", forfeit: false };

// Both players' figures, all at 0 unless a test says otherwise.
type Figures = Pick<DuelEnding, "result" | "opponentResult" | "score" | "opponentScore">;

const NO_FIGURES: Figures = {
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
};

const ending = (
  duelId: string,
  ranked: DuelEnding["ranked"],
  issue: Issue,
  figures: Figures,
  records: DuelEnding["records"],
): DuelEnding => ({
  ranked,
  duelId,
  ...issue,
  ...figures,
  opponent: { handle: "alan", image: null },
  records,
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
  ranked: false,
  tp: null,
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
  usePlayStore.setState({ play: "solo" });
  clock = holdGsapClock();
});

afterEach(() => {
  clock.release();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type RenderOptions = {
  duelId?: string;
  // The Duel just played, in the cache: the Duel chart reads it. Null: read from the API.
  cached?: ReplayedDuel | null;
  ranked?: DuelEnding["ranked"];
  aura?: AuraRuntime;
  issue?: Issue;
  figures?: Figures;
  // The User's Records from before the Duel: unread (none shown) unless a test says otherwise.
  records?: DuelEnding["records"];
  // The button the end screen is found by, in the Locale shown.
  newDuel?: string;
  // With a Tier-up to open: the entrance played up to it (by default), or left at its start.
  untilTierUp?: boolean;
};

const ada: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

// The end screen on a router of its own (its ways out are links), the written Duel in the cache
// unless said otherwise.
const renderEnded = async ({
  duelId = written.id,
  cached = written,
  ranked = null,
  aura = fakeAuraRuntime().runtime,
  issue = DRAW,
  figures = NO_FIGURES,
  records = null,
  newDuel = "Nouveau Duel",
  untilTierUp = true,
}: RenderOptions = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  // Read by the root route before any page: Nouveau Duel chooses the Duel for her.
  queryClient.setQueryData(meQueryOptions.queryKey, ada);

  if (cached !== null) {
    queryClient.setQueryData(replayedDuelQueryOptions(cached.id).queryKey, writtenDuelOf(cached));
  }

  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <DuelEnded ending={ending(duelId, ranked, issue, figures, records)} />,
    }),
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
  await screen.findByText(newDuel);

  // A Tier-up opens once the outcome and the band are in, at once under reduced motion.
  const reached = ranked === null ? null : tierReached(rankChange(ranked));

  if (
    untilTierUp &&
    reached !== null &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    await clock.advance(TIER_UP_AT + 0.01);
  }
};

const standing = <T extends DuelRanked["rank"]>(rank: T) => rank;

const gold = (division: 4 | 3 | 2 | 1, tp: number) => ({
  tier: "gold" as const,
  division,
  tp,
  shielded: false,
});

const silverI = standing({ tier: "silver", division: 1, tp: 90, shielded: false });

const goldIv = standing({ tier: "gold", division: 4, tp: 15, shielded: true });

const intoGold = { tp: 25, previousRank: silverI, rank: goldIv };

const intoBronze = {
  tp: 28,
  previousRank: standing({ tier: "iron", division: 1, tp: 85, shielded: false }),
  rank: standing({ tier: "bronze", division: 4, tp: 13, shielded: true }),
};

const intoSilver = {
  tp: 26,
  previousRank: standing({ tier: "bronze", division: 1, tp: 88, shielded: false }),
  rank: standing({ tier: "silver", division: 4, tp: 14, shielded: true }),
};

const intoPlatinum = {
  tp: 27,
  previousRank: standing({ tier: "gold", division: 1, tp: 86, shielded: false }),
  rank: standing({ tier: "platinum", division: 4, tp: 13, shielded: true }),
};

const intoDiamond = {
  tp: 29,
  previousRank: standing({ tier: "platinum", division: 1, tp: 84, shielded: false }),
  rank: standing({ tier: "diamond", division: 4, tp: 13, shielded: true }),
};

const intoManiac = {
  tp: 30,
  previousRank: standing({ tier: "diamond", division: 1, tp: 80, shielded: false }),
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

// The Tier whose Emblem the Tier-up takes apart, when it draws it in pieces of its own.
const emblemLeft = (tierUp: HTMLElement) =>
  tierUp.querySelector("[data-tier-up=old]")?.getAttribute("data-tier") ?? null;

// The gems of fire set in the Maniac's crown, and the flame over it, as its Emblem engraves them.
const GEMS_OF_FIRE = "[data-tier-up=engraving] > circle";

const CROWN_FLAME = "[data-tier-up=engraving] > g:last-child";

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

// The arguments of each focus the spy saw given to that element.
const focusCallsOn = (element: Element | null, focus: MockInstance<HTMLElement["focus"]>) =>
  focus.mock.calls.flatMap((call, index) => (focus.mock.contexts[index] === element ? [call] : []));

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
    expect(screen.getByRole("button", { name: "Revoir" })).toHaveAttribute(
      "href",
      "/history/duel-1",
    );
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

    await renderEnded({ cached: null });

    expect(screen.getByRole("status", { name: "Chargement du Duel chart" })).toBeInTheDocument();
  });

  test("a Duel detail that fails to load leaves the end screen, without its Duel chart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    await renderEnded({ cached: null });

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByRole("button", { name: "Nouveau Duel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoir" })).toBeInTheDocument();
    expect(screen.queryByRole("figure", { name: "Duel chart" })).toBeNull();
  });

  test("an unranked Duel (a Challenge) shows no rank, and no Tier-up", async () => {
    await renderEnded();

    expect(screen.queryByRole("region", { name: "Rang" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

// A Duel won 513 to 441: better on most lines, level on the raw and the best Combo.
const WON: Figures = {
  result: {
    wpm: 68.2,
    raw: 71.4,
    accuracy: 97.2,
    consistency: 63.8,
    chars: { correct: 142, incorrect: 3, extra: 0, missed: 1 },
  },
  opponentResult: {
    wpm: 61,
    raw: 70.6,
    accuracy: 94,
    consistency: 58,
    chars: { correct: 1270, incorrect: 8, extra: 1, missed: 2 },
  },
  score: { score: 1513, bestCombo: 12, bursts: 23 },
  opponentScore: { score: 441, bestCombo: 12, bursts: 17 },
};

// A line of the Duel's figures, by the names of both in the Locale shown.
const tapeLineIn = (tape: string, name: string) => {
  const header = within(screen.getByRole("region", { name: tape })).getByRole("rowheader", {
    name,
  });

  const line = header.closest("tr");

  expect(line).not.toBeNull();

  return line ?? header;
};

const tapeLine = (name: string) => tapeLineIn("Le Duel en chiffres", name);

// Who has the best value of a line: the triangles it shows, named « meilleur » (« best »).
const bestOn = (line: HTMLElement, best = "meilleur") => within(line).queryAllByText(best);

describe("the Affiche", () => {
  test.each<[Issue, string, string]>([
    [{ outcome: "win", forfeit: false }, "Victoire", "Tu bats @alan."],
    [{ outcome: "loss", forfeit: false }, "Défaite", "@alan l'emporte."],
    [{ outcome: "draw", forfeit: false }, "Draw", "Ni toi ni @alan ne l'emportez."],
    [{ outcome: "win", forfeit: true }, "Victoire", "Forfeit de @alan."],
    [{ outcome: "loss", forfeit: true }, "Défaite", "Forfeit : @alan l'emporte."],
  ])("tells the outcome %o: « %s », « %s »", async (issue, headline, detail) => {
    await renderEnded({ issue });

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(headline);
    expect(screen.getByText(detail)).toBeInTheDocument();
  });

  test("the band names both players with their Scores, in the Locale", async () => {
    await renderEnded({ issue: { outcome: "win", forfeit: false }, figures: WON });

    const band = screen.getByRole("region", { name: "Score" });

    expect(band).toHaveTextContent(/Toi\s*1\s513/u);
    expect(band).toHaveTextContent("@alan441");
  });

  test("tells the Duel line by line, the best value of each marked", async () => {
    await renderEnded({ figures: WON });

    expect(tapeLine("wpm")).toHaveTextContent("meilleur68wpm61");
    expect(tapeLine("précision")).toHaveTextContent(/meilleur97\s%précision94\s%/u);
    expect(tapeLine("meilleur combo")).toHaveTextContent("12meilleur combo12");
    expect(tapeLine("bursts")).toHaveTextContent("meilleur23bursts17");
    expect(tapeLine("raw")).toHaveTextContent("71raw71");
    expect(tapeLine("régularité")).toHaveTextContent(/meilleur64\s%régularité58\s%/u);

    expect(bestOn(tapeLine("wpm"))).toHaveLength(1);
    expect(bestOn(tapeLine("bursts"))).toHaveLength(1);
  });

  test("a line level on its rounded figures marks no best value", async () => {
    await renderEnded({ figures: WON });

    expect(bestOn(tapeLine("raw"))).toEqual([]);
    expect(bestOn(tapeLine("meilleur combo"))).toEqual([]);
  });

  test("the best value is on the side of whoever has it", async () => {
    await renderEnded({
      figures: { ...WON, opponentScore: { score: 441, bestCombo: 19, bursts: 17 } },
    });

    const line = tapeLine("meilleur combo");

    // The User's value, then the name, then the opponent's value and their triangle.
    expect(line.lastElementChild?.contains(bestOn(line)[0] ?? null)).toBe(true);
  });

  test("then both players' characters", async () => {
    await renderEnded({ figures: WON });

    expect(tapeLine("caractères")).toHaveTextContent("142/3/0/1caractères1 270/8/1/2");
  });

  test("the root takes the focus as the screen shows", async () => {
    await renderEnded();

    expect(endScreen()).toHaveFocus();
  });

  test("shows from the top of the page, without scrolling to its focus", async () => {
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    const scroll = vi.spyOn(window, "scrollTo");

    await renderEnded();

    const calls = focusCallsOn(endScreen(), focus);

    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    // Twice under StrictMode, which attaches the ref again: each without scrolling.
    expect(calls).toContainEqual([{ preventScroll: true }]);
    expect(calls.filter(([options]) => options?.preventScroll !== true)).toEqual([]);
  });

  test("names each block", async () => {
    await renderEnded({
      duelId: "duel-1",
      cached: written,
      ranked: { tp: 12, previousRank: gold(3, 40), rank: gold(3, 52) },
      records: { wpm: null, score: null, combo: null },
    });

    for (const name of [
      "Score",
      "Rang",
      "Records",
      "Le Duel en chiffres",
      "Le Duel seconde par seconde",
    ]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }

    expect(screen.getByRole("navigation", { name: "Après le Duel" })).toBeInTheDocument();
  });

  test("Nouveau Duel joins the Queue from Jouer, Retour au Solo goes back to Jouer in Solo", async () => {
    await renderEnded();

    const after = within(screen.getByRole("navigation", { name: "Après le Duel" }));

    expect(after.getByRole("button", { name: "Nouveau Duel" })).toHaveAttribute("href", "/");
    expect(after.getByRole("button", { name: "Retour au Solo" })).toHaveAttribute("href", "/");

    await userEvent.click(after.getByRole("button", { name: "Nouveau Duel" }));
    expect(usePlayStore.getState().play).toBe("duel");
  });

  test("Retour au Solo chooses Solo", async () => {
    usePlayStore.setState({ play: "duel" });
    await renderEnded();

    await userEvent.click(screen.getByRole("button", { name: "Retour au Solo" }));

    expect(usePlayStore.getState().play).toBe("solo");
  });

  test("the players' Results are no longer there, as cards of their own", async () => {
    await renderEnded({ figures: WON });

    expect(screen.queryByRole("region", { name: "Toi" })).toBeNull();
    expect(screen.queryByRole("region", { name: "@alan" })).toBeNull();
  });
});

const rankCard = (name = "Rang") => screen.getByRole("region", { name });

// The TP bar of the rank card, part by part: what the Duel kept, gained or lost of the Division,
// from where and how far, in % of it. Null without a bar.
const tpBarOf = (rank: HTMLElement) => {
  const bar = rank.querySelector("[data-tp-bar]");

  if (bar === null) {
    return null;
  }

  return Array.from(bar.querySelectorAll<HTMLElement>("[data-tp-part]"), (part) => ({
    part: part.dataset.tpPart,
    from: part.style.left,
    width: part.style.width,
  }));
};

// Which of the five Placement Duels are played, as the dashes under the Placement tell them.
const placementDashes = (rank: HTMLElement) =>
  Array.from(rank.querySelectorAll("[data-placement-dash]"), (dash) =>
    dash.getAttribute("data-placement-dash"),
  );

describe("the rank card", () => {
  test("TP won within the Division: the Blason, the TP, the rank, and what was kept, then gained", async () => {
    await renderEnded({ ranked: { tp: 12, previousRank: gold(3, 40), rank: gold(3, 52) } });

    const rank = rankCard();

    expect(blasonOf(rank)).toBe("#tier-emblem-gold");
    expect(rank).toHaveTextContent("+12 TP");
    expect(rank).toHaveTextContent("Gold III52 TP");
    expect(rank).toHaveTextContent("048 TP avant Gold II100");
    expect(rank).not.toHaveTextContent("Promotion");
    expect(rank).not.toHaveTextContent("Descente");
    expect(tpBarOf(rank)).toEqual([
      { part: "kept", from: "0%", width: "40%" },
      { part: "gained", from: "40%", width: "12%" },
    ]);
  });

  test("TP lost within the Division: kept down to the TP after it, the loss after that", async () => {
    await renderEnded({ ranked: { tp: -14, previousRank: gold(3, 52), rank: gold(3, 38) } });

    const rank = rankCard();

    expect(rank).toHaveTextContent("−14 TP");
    expect(rank).toHaveTextContent("Gold III38 TP");
    expect(rank).toHaveTextContent("62 TP avant Gold II");
    expect(tpBarOf(rank)).toEqual([
      { part: "kept", from: "0%", width: "38%" },
      { part: "lost", from: "38%", width: "14%" },
    ]);
  });

  test("a Draw that moved no TP: « ±0 TP », nothing gained", async () => {
    await renderEnded({ ranked: { tp: 0, previousRank: gold(3, 40), rank: gold(3, 40) } });

    const rank = rankCard();

    expect(rank).toHaveTextContent("±0 TP");
    expect(tpBarOf(rank)).toEqual([
      { part: "kept", from: "0%", width: "40%" },
      { part: "gained", from: "40%", width: "0%" },
    ]);
  });

  test("a promotion: « Promotion » over the new rank, never its name twice, the bar from 0", async () => {
    await renderEnded({ ranked: { tp: 12, previousRank: gold(3, 92), rank: gold(2, 4) } });

    const rank = rankCard();

    expect(rank).toHaveTextContent("+12 TP");
    expect(rank).toHaveTextContent("PromotionGold II4 TP");
    expect(within(rank).getAllByText(/Gold II\b/u)).toHaveLength(1);
    expect(rank).toHaveTextContent("96 TP avant Gold I");
    expect(tpBarOf(rank)).toEqual([
      { part: "kept", from: "0%", width: "0%" },
      { part: "gained", from: "0%", width: "4%" },
    ]);
  });

  test("a demotion: « Descente » over the new rank, the loss from the TP after it up to 100", async () => {
    await renderEnded({
      ranked: {
        tp: -14,
        previousRank: gold(4, 6),
        rank: standing({ tier: "silver", division: 1, tp: 92, shielded: false }),
      },
    });

    const rank = rankCard();

    expect(rank).toHaveTextContent("−14 TP");
    expect(rank).toHaveTextContent("DescenteSilver I92 TP");
    expect(within(rank).getAllByText(/Silver I\b/u)).toHaveLength(1);
    expect(rank).toHaveTextContent("8 TP avant Gold IV");
    expect(blasonOf(rank)).toBe("#tier-emblem-silver");
    expect(tpBarOf(rank)).toEqual([
      { part: "kept", from: "0%", width: "92%" },
      { part: "lost", from: "92%", width: "8%" },
    ]);
  });

  test("Maniac: the TP moved, « Maniac » and its TP, no bar", async () => {
    await renderEnded({
      ranked: {
        tp: 12,
        previousRank: standing({ tier: "maniac", tp: 250, shielded: false }),
        rank: standing({ tier: "maniac", tp: 262, shielded: false }),
      },
    });

    const rank = rankCard();

    expect(blasonOf(rank)).toBe("#tier-emblem-maniac");
    expect(rank).toHaveTextContent("+12 TP");
    expect(rank).toHaveTextContent("Maniac262 TP");
    expect(rank).not.toHaveTextContent("avant");
    expect(tpBarOf(rank)).toBeNull();
  });

  test("a Placement Duel: « 3/5 », the Placements left, five dashes, those played lit", async () => {
    await renderEnded({
      ranked: { tp: null, previousRank: { placementsLeft: 3 }, rank: { placementsLeft: 2 } },
    });

    const rank = rankCard();

    expect(rank).toHaveTextContent("3/5");
    expect(rank).toHaveTextContent("Placement : encore 2 Duels avant ton rang");
    expect(placementDashes(rank)).toEqual(["played", "played", "played", "ahead", "ahead"]);
    expect(blasonOf(rank)).toBeNull();
    expect(rank).not.toHaveTextContent("TP");
  });

  test("the last Placement: the rank revealed at 0 TP, an empty bar, no TP moved", async () => {
    await renderEnded({
      ranked: {
        tp: null,
        previousRank: { placementsLeft: 1 },
        rank: standing({ tier: "bronze", division: 4, tp: 0, shielded: false }),
      },
    });

    const rank = rankCard();

    expect(blasonOf(rank)).toBe("#tier-emblem-bronze");
    expect(rank).toHaveTextContent("Placement terminéBronze IV0 TP");
    expect(rank).toHaveTextContent("0100 TP avant Bronze III100");
    expect(rank).not.toHaveTextContent("+");
    expect(tpBarOf(rank)).toEqual([
      { part: "kept", from: "0%", width: "0%" },
      { part: "gained", from: "0%", width: "0%" },
    ]);
  });

  test("the TP in the Locale's figures", async () => {
    await renderEnded({
      ranked: {
        tp: 12,
        previousRank: standing({ tier: "maniac", tp: 1250, shielded: false }),
        rank: standing({ tier: "maniac", tp: 1262, shielded: false }),
      },
    });

    expect(rankCard()).toHaveTextContent(/Maniac1\s262 TP/u);
  });
});

// The end screen in English, found by its English button.
// The tile of one of the User's Records, by its name in the Locale shown.
const recordTile = (name: string) => {
  const tile = within(screen.getByRole("region", { name: "Records" }))
    .getByText(name)
    .closest("li");

  expect(tile).not.toBeNull();

  return tile ?? screen.getByRole("region", { name: "Records" });
};

// The Records before a Duel won at 68.2 wpm, 1 513 points and a best Combo of 12 (WON): the wpm
// and the Score beaten, the Combo not.
const BEATEN = { wpm: 64, score: 1200, combo: 19 };

describe("the Records", () => {
  test("a Record beaten: in the accent, « Nouveau record », this Duel's figure and by how much", async () => {
    await renderEnded({ figures: WON, records: BEATEN });

    expect(recordTile("meilleur wpm")).toHaveTextContent(
      "meilleur wpmNouveau record68avant 64 · +4",
    );
    expect(recordTile("meilleur Score")).toHaveTextContent(
      /^meilleur ScoreNouveau record1\s513avant 1\s200 · \+313$/u,
    );
  });

  test("a Record not beaten: the Record, then this Duel's figure", async () => {
    await renderEnded({ figures: WON, records: BEATEN });

    expect(recordTile("meilleur Combo")).toHaveTextContent(/^meilleur Combo19ce Duel 12$/u);
  });

  test("a Record only equalled is not beaten", async () => {
    await renderEnded({ figures: WON, records: { ...BEATEN, wpm: 68 } });

    expect(recordTile("meilleur wpm")).toHaveTextContent(/^meilleur wpm68ce Duel 68$/u);
  });

  test("the figures compared are the rounded ones the Profile shows: 68.2 then 68.4 beats nothing", async () => {
    await renderEnded({
      figures: { ...WON, result: { ...WON.result, wpm: 68.4 } },
      records: { ...BEATEN, wpm: 68.2 },
    });

    expect(recordTile("meilleur wpm")).toHaveTextContent(/^meilleur wpm68ce Duel 68$/u);
  });

  test("a first Duel sets all three", async () => {
    await renderEnded({ figures: WON, records: { wpm: null, score: null, combo: null } });

    expect(recordTile("meilleur wpm")).toHaveTextContent(
      /^meilleur wpmNouveau record68premier Record$/u,
    );
    expect(recordTile("meilleur Score")).toHaveTextContent(/Nouveau record1\s513premier Record$/u);
    expect(recordTile("meilleur Combo")).toHaveTextContent(/Nouveau record12premier Record$/u);
  });

  test("no Records read: no tile at all", async () => {
    await renderEnded({ figures: WON });

    expect(screen.queryByRole("region", { name: "Records" })).toBeNull();
    expect(screen.queryByText("Record")).toBeNull();
  });

  test("a Score beaten stamps « Record » beside the User's Score in the band", async () => {
    await renderEnded({ figures: WON, records: BEATEN });

    expect(screen.getByRole("region", { name: "Score" })).toHaveTextContent(
      /^Toi1\s513Record@alan441$/u,
    );
  });

  test("a Score not beaten stamps nothing", async () => {
    await renderEnded({ figures: WON, records: { ...BEATEN, score: 1513 } });

    expect(screen.getByRole("region", { name: "Score" })).not.toHaveTextContent("Record");
  });

  test("a wpm or a Combo beaten tags its line of the tale of the tape", async () => {
    await renderEnded({ figures: WON, records: { wpm: 64, score: 2000, combo: 10 } });

    expect(tapeLine("wpm")).toHaveTextContent("Recordmeilleur68wpm61");
    expect(tapeLine("meilleur combo")).toHaveTextContent("Record12meilleur combo12");
    expect(tapeLine("bursts")).not.toHaveTextContent("Record");
  });

  test("a wpm or a Combo not beaten tags nothing", async () => {
    // The wpm short of its Record, the Combo only equalling it.
    await renderEnded({ figures: WON, records: { wpm: 70, score: 2000, combo: 12 } });

    expect(tapeLine("wpm")).not.toHaveTextContent("Record");
    expect(tapeLine("meilleur combo")).not.toHaveTextContent("Record");
  });

  test("a Record set in a Duel lost by Forfeit is celebrated all the same", async () => {
    await renderEnded({
      issue: { outcome: "loss", forfeit: true },
      figures: WON,
      records: { wpm: 100, score: 5000, combo: 5 },
    });

    expect(recordTile("meilleur Combo")).toHaveTextContent(
      /^meilleur ComboNouveau record12avant 5 · \+7$/u,
    );
    expect(recordTile("meilleur wpm")).toHaveTextContent(/^meilleur wpm100ce Duel 68$/u);
  });

  test("a Challenge's Records are celebrated too", async () => {
    await renderEnded({ ranked: null, figures: WON, records: BEATEN });

    expect(recordTile("meilleur wpm")).toHaveTextContent("Nouveau record");
  });
});

const renderInEnglish = (options: RenderOptions = {}) =>
  renderEnded({ newDuel: "New Duel", ...options });

describe("DuelEnded in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test.each<[Issue, string, string]>([
    [{ outcome: "win", forfeit: false }, "Victory", "You beat @alan."],
    [{ outcome: "loss", forfeit: false }, "Defeat", "@alan wins."],
    [{ outcome: "draw", forfeit: false }, "Draw", "You and @alan tie."],
    [{ outcome: "win", forfeit: true }, "Victory", "@alan forfeited."],
    [{ outcome: "loss", forfeit: true }, "Defeat", "Forfeit: @alan wins."],
  ])("tells the outcome %o: « %s », « %s »", async (issue, headline, detail) => {
    await renderInEnglish({ issue });

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(headline);
    expect(screen.getByText(detail)).toBeInTheDocument();
  });

  test("names the band, the Duel's figures and what comes after, in the Locale", async () => {
    await renderInEnglish({ duelId: "duel-1", cached: written, figures: WON });

    expect(screen.getByRole("region", { name: "Score" })).toHaveTextContent(/You\s*1,513/u);
    expect(screen.getByRole("region", { name: "The Duel in figures" })).toBeInTheDocument();
    expect(tapeLineIn("The Duel in figures", "accuracy")).toHaveTextContent("best97%accuracy94%");
    expect(tapeLineIn("The Duel in figures", "characters")).toHaveTextContent(
      "142/3/0/1characters1,270/8/1/2",
    );
    expect(bestOn(tapeLineIn("The Duel in figures", "wpm"), "best")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "The Duel second by second" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "After the Duel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Solo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Duel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watch the Replay" })).toHaveAttribute(
      "href",
      "/history/duel-1",
    );
  });

  test("the Records, beaten, not beaten and first, in the Locale", async () => {
    await renderInEnglish({ figures: WON, records: { ...BEATEN, wpm: null } });

    expect(recordTile("best wpm")).toHaveTextContent(/^best wpmNew record68first Record$/u);
    expect(recordTile("best Score")).toHaveTextContent(
      /^best ScoreNew record1,513before 1,200 · \+313$/u,
    );
    expect(recordTile("best Combo")).toHaveTextContent(/^best Combo19this Duel 12$/u);
    expect(tapeLineIn("The Duel in figures", "wpm")).toHaveTextContent("Recordbest68wpm61");
  });

  test("names the Duel chart's loading state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => {})),
    );

    await renderInEnglish({ cached: null });

    expect(screen.getByRole("status", { name: "Loading the Duel chart" })).toBeInTheDocument();
  });

  test("a promotion and a demotion", async () => {
    await renderInEnglish({ ranked: { tp: 12, previousRank: gold(3, 92), rank: gold(2, 4) } });

    expect(rankCard("Rank")).toHaveTextContent("+12 TP");
    expect(rankCard("Rank")).toHaveTextContent("PromotionGold II4 TP");
    expect(rankCard("Rank")).toHaveTextContent("096 TP to Gold I100");

    cleanup();
    await renderInEnglish({
      ranked: {
        tp: -14,
        previousRank: gold(4, 6),
        rank: standing({ tier: "silver", division: 1, tp: 92, shielded: false }),
      },
    });

    expect(rankCard("Rank")).toHaveTextContent("−14 TP");
    expect(rankCard("Rank")).toHaveTextContent("DemotionSilver I92 TP");
  });

  test("TP won, TP lost, and Maniac without a bar", async () => {
    await renderInEnglish({ ranked: { tp: 12, previousRank: gold(3, 40), rank: gold(3, 52) } });

    expect(rankCard("Rank")).toHaveTextContent("+12 TP");
    expect(rankCard("Rank")).toHaveTextContent("Gold III52 TP048 TP to Gold II100");

    cleanup();
    await renderInEnglish({ ranked: { tp: -14, previousRank: gold(3, 52), rank: gold(3, 38) } });

    expect(rankCard("Rank")).toHaveTextContent("−14 TP");
    expect(rankCard("Rank")).toHaveTextContent("62 TP to Gold II");

    cleanup();
    await renderInEnglish({
      ranked: {
        tp: 12,
        previousRank: standing({ tier: "maniac", tp: 250, shielded: false }),
        rank: standing({ tier: "maniac", tp: 262, shielded: false }),
      },
    });

    expect(rankCard("Rank")).toHaveTextContent("+12 TPManiac262 TP");
    expect(tpBarOf(rankCard("Rank"))).toBeNull();
  });

  test("a Draw that moved no TP, and the TP in the Locale's figures", async () => {
    await renderInEnglish({ ranked: { tp: 0, previousRank: gold(3, 40), rank: gold(3, 40) } });

    expect(rankCard("Rank")).toHaveTextContent("±0 TP");

    cleanup();
    await renderInEnglish({
      ranked: {
        tp: 12,
        previousRank: standing({ tier: "maniac", tp: 1250, shielded: false }),
        rank: standing({ tier: "maniac", tp: 1262, shielded: false }),
      },
    });

    expect(rankCard("Rank")).toHaveTextContent("Maniac1,262 TP");
  });

  test.each([
    [2, "Placement: 2 more Duels until your rank"],
    [1, "Placement: 1 more Duel until your rank"],
  ])("%i Placement Duels left: « %s »", async (placementsLeft, said) => {
    await renderInEnglish({
      ranked: { tp: null, previousRank: { placementsLeft: 3 }, rank: { placementsLeft } },
    });

    expect(rankCard("Rank")).toHaveTextContent(said);
    expect(rankCard("Rank")).toHaveTextContent(`${String(5 - placementsLeft)}/5`);
  });

  test("the last Placement reveals the rank", async () => {
    await renderInEnglish({
      ranked: {
        tp: null,
        previousRank: { placementsLeft: 1 },
        rank: standing({ tier: "bronze", division: 4, tp: 0, shielded: false }),
      },
    });

    expect(rankCard("Rank")).toHaveTextContent("Placement completeBronze IV0 TP");
    expect(rankCard("Rank")).toHaveTextContent("100 TP to Bronze III");
  });
});

describe("the Tier-up in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("a new Tier: its name, the route of the rank, and « Continue »", async () => {
    await renderInEnglish({ ranked: intoGold });

    const tierUp = screen.getByRole("dialog", { name: "Gold" });

    expect(tierUp).toHaveTextContent("New Tier");
    expect(tierUp).toHaveTextContent("Silver I → Gold IV");
    expect(within(tierUp).getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  test("Maniac, the top Tier", async () => {
    await renderInEnglish({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog", { name: "Maniac" });

    expect(tierUp).toHaveTextContent("Top Tier");
    expect(tierUp).toHaveTextContent("Diamond I → Maniac");
  });
});

describe("the Tier-up", () => {
  test("a Duel into a new Tier opens it, named by the Tier, all its text there at once", async () => {
    await renderEnded({ ranked: intoGold });

    const tierUp = screen.getByRole("dialog", { name: "Gold" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Silver I → Gold IV");
    expect(within(tierUp).getByRole("button", { name: "Continuer" })).toBeInTheDocument();
    expect(emblemOf(tierUp)).toBe("#tier-emblem-silver");
    expect(emblemReached(tierUp)).toBe("gold");
  });

  test("leaves the end screen behind it out of reach", async () => {
    await renderEnded({ ranked: intoGold });

    expect(screen.getByRole("dialog", { name: "Gold" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nouveau Duel" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Rang" })).toBeNull();
  });

  test("stays in the dark of its metal under Paper, the light Theme", async () => {
    document.documentElement.dataset.theme = "paper";
    await renderEnded({ ranked: intoGold });

    expect(screen.getByRole("dialog", { name: "Gold" })).toHaveAttribute("data-theme", "coral");
    delete document.documentElement.dataset.theme;
  });

  test("scales its stage to fit the window whole", async () => {
    await renderEnded({ ranked: intoGold });

    const stage = screen.getByRole("dialog").querySelector("[data-tier-up=stage]");
    const scale = stageScale(window.innerWidth, window.innerHeight);

    expect(stage).toHaveStyle({ transform: `translate(-50%, -50%) scale(${scale})` });
  });

  test("a Duel into Maniac opens it, as the ultimate Tier", async () => {
    await renderEnded({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog", { name: "Maniac" });

    expect(tierUp).toHaveTextContent("Palier ultime");
    expect(tierUp).toHaveTextContent("Diamond I → Maniac");
    expect(emblemLeft(tierUp)).toBe("diamond");
    expect(emblemReached(tierUp)).toBe("maniac");
  });

  test.each([
    ["a move up a Division", { tp: 20, previousRank: gold(3, 90), rank: gold(2, 10) }],
    ["a demotion out of a Tier", { tp: -18, previousRank: gold(4, 5), rank: silverI }],
    ["TP within the Division", { tp: 12, previousRank: gold(3, 40), rank: gold(3, 52) }],
    ["a Placement", { tp: null, previousRank: { placementsLeft: 3 }, rank: { placementsLeft: 2 } }],
    ["the last Placement", { tp: null, previousRank: { placementsLeft: 1 }, rank: goldIv }],
  ])("does not open for %s", async (_, ranked: DuelRanked) => {
    await renderEnded({ ranked });
    await clock.advance(5);

    expect(screen.getByRole("region", { name: "Rang" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(played).toEqual([]);
  });

  test("Iron → Bronze sounds as the iron comes apart, as the Blason lands, then with the name", async () => {
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

  test("a Duel into Silver opens it, the bronze Emblem there to split", async () => {
    await renderEnded({ ranked: intoSilver });

    const tierUp = screen.getByRole("dialog", { name: "Silver" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Bronze I → Silver IV");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-bronze");
    expect(emblemReached(tierUp)).toBe("silver");
  });

  test("Bronze → Silver sounds as the bronze cracks, as the Silver strikes, then with the name", async () => {
    await renderEnded({ ranked: intoSilver });

    await clock.advance(0.8);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-silver-crack"]);

    await clock.advance(1);
    expect(played).toEqual(["tier-up-silver-crack", "tier-up-silver-impact"]);

    // Each chevron stamped in, then the name.
    await clock.advance(0.7);
    expect(played).toEqual([
      "tier-up-silver-crack",
      "tier-up-silver-impact",
      "tier-up-silver-stamp",
      "tier-up-silver-stamp",
      "tier-up-silver-name",
    ]);

    // The light sweeping over the metal.
    await clock.advance(0.3);
    expect(played.at(-1)).toBe("tier-up-silver-sweep");

    await clock.advance(0.9);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.1);
    expect(continueButton()).toHaveFocus();
    expect(played).toHaveLength(6);
  });

  test("Bronze → Silver skipped as it strikes: no chevron, sweep nor name heard after", async () => {
    await renderEnded({ ranked: intoSilver });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.1);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-silver-crack", "tier-up-silver-impact"]);
  });

  test("Silver → Gold sounds as the silver ascends, as the Gold materializes, then with the name", async () => {
    await renderEnded({ ranked: intoGold });

    await clock.advance(0.7);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-gold-ascend"]);

    await clock.advance(1);
    expect(played).toEqual(["tier-up-gold-ascend"]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-gold-ascend", "tier-up-gold-materialize"]);

    await clock.advance(0.6);
    expect(played).toEqual([
      "tier-up-gold-ascend",
      "tier-up-gold-materialize",
      "tier-up-gold-name",
    ]);

    await clock.advance(1);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(3);
  });

  test("Silver → Gold skipped as it materializes: no name heard after", async () => {
    await renderEnded({ ranked: intoGold });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.1);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-gold-ascend", "tier-up-gold-materialize"]);
  });

  test("Silver → Gold traces its laurels and its star, little by little, once it has materialized", async () => {
    await renderEnded({ ranked: intoGold });

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

  test("Silver → Gold pops its leaves in pair by pair, none seen before", async () => {
    await renderEnded({ ranked: intoGold });

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

  test("a Duel into Platinum opens it, the Gold Emblem there to turn over", async () => {
    await renderEnded({ ranked: intoPlatinum });

    const tierUp = screen.getByRole("dialog", { name: "Platinum" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Gold I → Platinum IV");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-gold");
    expect(emblemReached(tierUp)).toBe("platinum");
  });

  test("Gold → Platinum sounds as the gold turns over, as the Platinum assembles, then with the name", async () => {
    await renderEnded({ ranked: intoPlatinum });

    await clock.advance(0.8);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-platinum-flip"]);

    await clock.advance(1.2);
    expect(played).toEqual(["tier-up-platinum-flip"]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-platinum-flip", "tier-up-platinum-assemble"]);

    await clock.advance(0.4);
    expect(played).toEqual([
      "tier-up-platinum-flip",
      "tier-up-platinum-assemble",
      "tier-up-platinum-name",
    ]);

    await clock.advance(1.2);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(3);
  });

  test("Gold → Platinum skipped as it assembles: no name heard after", async () => {
    await renderEnded({ ranked: intoPlatinum });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.4);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-platinum-flip", "tier-up-platinum-assemble"]);
  });

  test("Gold → Platinum assembles its hexagon triangle by triangle, whole at the impact", async () => {
    await renderEnded({ ranked: intoPlatinum });

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
    ["Silver → Gold", intoGold, "#5c3f06"],
    ["Gold → Platinum", intoPlatinum, "#134a42"],
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

  test("Gold → Platinum pops its studs in one by one, then unfurls its wings, none seen before", async () => {
    await renderEnded({ ranked: intoPlatinum });

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

  test("a Duel into Diamond opens it, the Platinum Emblem there to implode", async () => {
    await renderEnded({ ranked: intoDiamond });

    const tierUp = screen.getByRole("dialog", { name: "Diamond" });

    expect(tierUp).toHaveTextContent("Nouveau palier");
    expect(tierUp).toHaveTextContent("Platinum I → Diamond IV");
    expect(emblemOf(tierUp)).toBe("#tier-emblem-platinum");
    expect(emblemReached(tierUp)).toBe("diamond");
  });

  test("Platinum → Diamond sounds as the Platinum implodes, as its facets converge, as the gem slams down, then with the name", async () => {
    await renderEnded({ ranked: intoDiamond });

    await clock.advance(0.7);
    expect(played).toEqual([]);

    await clock.advance(0.2);
    expect(played).toEqual(["tier-up-diamond-implode"]);

    await clock.advance(1.3);
    expect(played).toEqual(["tier-up-diamond-implode", "tier-up-diamond-converge"]);

    await clock.advance(1.5);
    expect(played).toHaveLength(2);

    await clock.advance(0.2);
    expect(played).toEqual([
      "tier-up-diamond-implode",
      "tier-up-diamond-converge",
      "tier-up-diamond-slam",
    ]);

    await clock.advance(0.1);
    expect(played.at(-1)).toBe("tier-up-diamond-name");

    await clock.advance(1.2);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(4);
  });

  test("Platinum → Diamond skipped as its facets converge: no slam nor name heard after", async () => {
    await renderEnded({ ranked: intoDiamond });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(2.5);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toEqual(["tier-up-diamond-implode", "tier-up-diamond-converge"]);
  });

  test("Platinum → Diamond darkens and blinds past its stage too, never cut at its edges", async () => {
    await renderEnded({ ranked: intoDiamond });

    const tierUp = screen.getByRole("dialog");
    const stage = tierUp.querySelector("[data-tier-up=stage]");

    // In a window wider or taller than the stage, its vignette and its white go on past its edges.
    expect(stage).not.toHaveClass("overflow-hidden");

    for (const light of ["vignette", "whiteout"]) {
      expect(tierUp.querySelector(`[data-tier-up=${light}]`)).toHaveStyle({
        left: "-1440px",
        top: "-900px",
        width: "4320px",
        height: "2700px",
      });
    }
  });

  test("Platinum → Diamond cuts its gem facet by facet, all in place before it slams down", async () => {
    await renderEnded({ ranked: intoDiamond });

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

  test("Platinum → Diamond unfurls its wings feather by feather after the impact, none seen before", async () => {
    await renderEnded({ ranked: intoDiamond });

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

  test("Platinum → Diamond slams its name down whole, its two ghosts gone once it has", async () => {
    await renderEnded({ ranked: intoDiamond });

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

  test("Diamond → Maniac sounds with the heat, the vortex, the silence, the crown's quake, the fire and the name", async () => {
    await renderEnded({ ranked: intoManiac });

    await clock.advance(0.45);
    expect(played).toEqual([]);

    await clock.advance(0.1);
    expect(played).toEqual(["tier-up-maniac-heat"]);

    await clock.advance(1.5);
    expect(played).toHaveLength(1);

    await clock.advance(0.1);
    expect(played).toEqual(["tier-up-maniac-heat", "tier-up-maniac-vortex"]);

    await clock.advance(0.65);
    expect(played.at(-1)).toBe("tier-up-maniac-hush");

    await clock.advance(0.95);
    expect(played).toHaveLength(3);

    await clock.advance(0.1);
    expect(played.at(-1)).toBe("tier-up-maniac-quake");

    await clock.advance(3);
    expect(played).toHaveLength(4);

    await clock.advance(0.1);
    expect(played.at(-1)).toBe("tier-up-maniac-ignite");

    await clock.advance(0.25);
    expect(played).toEqual([
      "tier-up-maniac-heat",
      "tier-up-maniac-vortex",
      "tier-up-maniac-hush",
      "tier-up-maniac-quake",
      "tier-up-maniac-ignite",
      "tier-up-maniac-name",
    ]);

    await clock.advance(1.65);
    expect(continueButton()).not.toHaveFocus();

    await clock.advance(0.2);
    expect(continueButton()).toHaveFocus();
    await clock.advance(5);
    expect(played).toHaveLength(6);
  });

  test("Diamond → Maniac skipped in its silence: no quake, fire nor name heard after", async () => {
    await renderEnded({ ranked: intoManiac });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    await clock.advance(3);

    await userEvent.keyboard("{Enter}");

    expect(continueButton()).toHaveFocus();
    await clock.advance(8);
    expect(played).toEqual(["tier-up-maniac-heat", "tier-up-maniac-vortex", "tier-up-maniac-hush"]);
  });

  test("Diamond → Maniac breaks the gem into its facets, flung away as the vortex takes them", async () => {
    await renderEnded({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog");
    const facets = [...tierUp.querySelectorAll("[data-tier-up=gem-facet]")];
    const gem = tierUp.querySelector("[data-tier-up=gem]");

    expect(facets).toHaveLength(8);

    await clock.advance(2.05);
    expect(opacitiesOf(facets)).toEqual(Array(8).fill(1));
    expect(facets.map((facet) => gsap.getProperty(facet, "x"))).toEqual(Array(8).fill(0));
    expect(gsap.getProperty(gem, "opacity")).toBe(1);

    await clock.advance(0.4);
    expect(gsap.getProperty(facets[0] ?? tierUp, "x")).toBeLessThan(0);
    expect(gsap.getProperty(gem, "opacity")).toBe(0);

    await clock.advance(0.8);
    expect(opacitiesOf(facets)).toEqual(Array(8).fill(0));
  });

  test("Diamond → Maniac drops its crown after the silence, then lights its gems and its flame", async () => {
    await renderEnded({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog");
    const drop = tierUp.querySelector("[data-tier-up=drop]");
    const gems = [...tierUp.querySelectorAll(GEMS_OF_FIRE)];
    const flame = tierUp.querySelector(CROWN_FLAME);

    expect(gems).toHaveLength(5);

    await clock.advance(3.15);
    expect(gsap.getProperty(drop, "opacity")).toBe(0);

    await clock.advance(0.2);
    expect(gsap.getProperty(drop, "opacity")).toBe(1);
    expect(gsap.getProperty(drop, "y")).toBeLessThan(0);

    await clock.advance(0.5);
    expect(gsap.getProperty(drop, "y")).toBe(0);
    expect(opacitiesOf(gems)).toEqual(Array(5).fill(0));

    await clock.advance(0.4);
    expect(opacitiesOf(gems)[0]).toBeGreaterThan(0);
    expect(opacitiesOf(gems)[4]).toBe(0);
    expect(gsap.getProperty(flame, "opacity")).toBe(0);

    await clock.advance(1.4);
    expect(opacitiesOf(gems)).toEqual(Array(5).fill(1));
    expect(gsap.getProperty(flame, "opacity")).toBe(1);
  });

  test("Diamond → Maniac spreads its wings feather by feather, none seen before", async () => {
    await renderEnded({ ranked: intoManiac });

    const feathers = [...screen.getByRole("dialog").querySelectorAll("[data-tier-up=feather]")];

    expect(feathers).toHaveLength(16);

    await clock.advance(4.95);
    expect(opacitiesOf(feathers)).toEqual(Array(16).fill(0));

    await clock.advance(0.2);
    expect(opacitiesOf(feathers).some((opacity) => Number(opacity) > 0)).toBe(true);
    expect(opacitiesOf(feathers).some((opacity) => opacity === 0)).toBe(true);

    await clock.advance(1.5);
    expect(opacitiesOf(feathers)).toEqual(Array(16).fill(1));
  });

  test("Diamond → Maniac brings its name in letter by letter once it has caught fire", async () => {
    await renderEnded({ ranked: intoManiac });

    const letters = [...screen.getByRole("dialog").querySelectorAll("[data-tier-up=letter]")];

    expect(letters).toHaveLength(6);

    await clock.advance(7.1);
    expect(opacitiesOf(letters)).toEqual(Array(6).fill(0));

    await clock.advance(0.15);
    expect(opacitiesOf(letters)[0]).toBeGreaterThan(0);
    expect(opacitiesOf(letters)[5]).toBe(0);

    await clock.advance(0.8);
    expect(opacitiesOf(letters)).toEqual(Array(6).fill(1));
  });

  test("Diamond → Maniac holds its breath and burns past its stage too, never cut at its edges", async () => {
    await renderEnded({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog");

    for (const light of ["heat", "hush"]) {
      expect(tierUp.querySelector(`[data-tier-up=${light}]`)).toHaveStyle({
        left: "-1440px",
        top: "-900px",
        width: "4320px",
        height: "2700px",
      });
    }
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
      expect(screen.getByRole("region", { name: "Rang" })).toHaveTextContent("PromotionBronze IV");
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
  test("from Gold, the Emblem lands in its full Aura, let go once the Tier-up is closed", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoGold, aura: browser.runtime });
    await settle();

    expect(held(browser)).toEqual(["gold"]);

    await userEvent.click(continueButton());

    expect(held(browser)).toEqual([]);
  });

  test("Silver → Gold lights its full Aura at the impact, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoGold, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(1.95);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.1);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(0.8);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["gold"]);
  });

  test("under reduced motion, Silver → Gold opens with its full Aura already lit", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoGold });

    const aura = screen.getByRole("dialog", { name: "Gold" }).querySelector("[data-tier-up=aura]");

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(played).toEqual(["tier-up-gold-materialize"]);
  });

  test("Gold → Platinum lights its full Aura at the impact, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoPlatinum, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(2.25);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.1);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(0.8);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["platinum"]);
  });

  test("under reduced motion, Gold → Platinum opens with its full Aura already lit", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoPlatinum });

    const aura = screen
      .getByRole("dialog", { name: "Platinum" })
      .querySelector("[data-tier-up=aura]");

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(played).toEqual(["tier-up-platinum-assemble"]);
  });

  test("Platinum → Diamond lights its full Aura at the impact, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoDiamond, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(3.75);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.1);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(0.8);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["diamond"]);
  });

  test("under reduced motion, Platinum → Diamond opens with its gem, wings and full Aura in place, and its name", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoDiamond });

    const tierUp = screen.getByRole("dialog", { name: "Diamond" });

    const lit = [
      ...tierUp.querySelectorAll(
        "[data-tier-up=aura], [data-tier-up=body], [data-tier-up=feather], [data-tier-up=crystal], [data-tier-up=name]",
      ),
    ];

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(opacitiesOf(lit)).toEqual(Array(lit.length).fill(1));
    expect(played).toEqual(["tier-up-diamond-slam"]);
  });

  test("Diamond → Maniac lights its full Aura as it catches fire, never before", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoManiac, aura: browser.runtime });
    await settle();

    const aura = screen.getByRole("dialog").querySelector("[data-tier-up=aura]");

    await clock.advance(6.85);
    expect(gsap.getProperty(aura, "opacity")).toBe(0);

    await clock.advance(0.15);
    expect(gsap.getProperty(aura, "opacity")).toBeGreaterThan(0);

    await clock.advance(1.4);
    expect(gsap.getProperty(aura, "opacity")).toBe(1);
    expect(held(browser)).toEqual(["maniac"]);
  });

  test("under reduced motion, Diamond → Maniac opens with its crown ablaze, its wings and full Aura, and its name", async () => {
    reduceMotion();

    await renderEnded({ ranked: intoManiac });

    const tierUp = screen.getByRole("dialog", { name: "Maniac" });

    const lit = [
      ...tierUp.querySelectorAll(
        `[data-tier-up=aura], [data-tier-up=drop], ${GEMS_OF_FIRE}, ${CROWN_FLAME}, [data-tier-up=feather], [data-tier-up=letter]`,
      ),
    ];

    const gone = [...tierUp.querySelectorAll("[data-tier-up=gem], [data-tier-up=gem-facet]")];

    await waitFor(() => expect(continueButton()).toHaveFocus());
    expect(opacitiesOf(lit)).toEqual(Array(lit.length).fill(1));
    expect(opacitiesOf(gone)).toEqual(Array(gone.length).fill(0));
    expect(played).toEqual(["tier-up-maniac-quake"]);
  });

  test("below Gold, there is no full Aura to ask for", async () => {
    const browser = fakeAuraRuntime();

    await renderEnded({ ranked: intoBronze, aura: browser.runtime });
    await settle();

    expect(browser.painters).toEqual([]);
  });

  test("refused, the Emblem lands without it", async () => {
    const browser = fakeAuraRuntime({ webgl2: false });

    await renderEnded({ ranked: intoGold, aura: browser.runtime });
    await settle();

    const tierUp = screen.getByRole("dialog", { name: "Gold" });

    expect(tierUp.querySelector("[data-aura-canvas]")).toBeNull();
    expect(emblemReached(tierUp)).toBe("gold");
  });
});

// The whole Affiche: a ranked Duel won within the Division, two Records beaten, written.
const AFFICHE: RenderOptions = {
  duelId: "duel-1",
  cached: written,
  ranked: { tp: 12, previousRank: gold(3, 40), rank: gold(3, 52) },
  issue: { outcome: "win", forfeit: false },
  figures: WON,
  records: BEATEN,
};

// Found behind a Tier-up too, where the end screen is out of reach.
const HIDDEN = { hidden: true };

// The block the outcome's headline heads.
const outcomeBlock = () => {
  const block = screen.getByRole("heading", {
    level: 2,
    name: "Victoire",
    ...HIDDEN,
  }).parentElement;

  expect(block).not.toBeNull();

  return block ?? document.body;
};

const regionOf = (name: string) => screen.getByRole("region", { name, ...HIDDEN });

// How a block comes in: fading in (and moving), filling up, or the band's slant sliding to its
// share.
type Entrance = "fade" | "fill" | "slant";

// Where each block stands before its entrance, as GSAP wrote it.
const STARTS: Record<Entrance, (block: HTMLElement) => boolean> = {
  fade: (block) => block.style.opacity === "0",
  fill: (block) => gsap.getProperty(block, "scaleX") === 0,
  slant: (block) => block.style.getPropertyValue("--share-in") === "0",
};

// Where each block stands once in: nothing of that entrance left on it.
const ENDS: Record<Entrance, (block: HTMLElement) => boolean> = {
  fade: (block) => block.style.opacity === "" && block.style.transform === "",
  fill: (block) => block.style.transform === "",
  slant: (block) => block.style.getPropertyValue("--share-in") === "",
};

// Nothing of the entrance on a block at all.
const arrived = (block: HTMLElement) => Object.values(ENDS).every((ended) => ended(block));

type EntranceBlock = {
  name: string;
  blocksOf: () => HTMLElement[];
  from: number;
  to: number;
  entrance: Entrance;
};

// Each block of the Affiche, from when it starts coming in to when it is in, in seconds.
const ENTRANCE: EntranceBlock[] = [
  {
    name: "the outcome",
    blocksOf: () => [outcomeBlock()],
    from: 0,
    to: 0.35,
    entrance: "fade",
  },
  { name: "the band", blocksOf: () => [regionOf("Score")], from: 0.2, to: 0.55, entrance: "fade" },
  {
    name: "the band's slant",
    blocksOf: () => [regionOf("Score")],
    from: 0.2,
    to: 0.8,
    entrance: "slant",
  },
  {
    name: "the band's stamp",
    blocksOf: () => [within(regionOf("Score")).getByText("Record")],
    from: 0.7,
    to: 0.95,
    entrance: "fade",
  },
  {
    name: "the rank card",
    blocksOf: () => [regionOf("Rang")],
    from: 0.5,
    to: 0.85,
    entrance: "fade",
  },
  {
    name: "the TP",
    // However many TP the Duel moved.
    blocksOf: () => [within(regionOf("Rang")).getByText(/^\+\d+ TP$/u)],
    from: 0.6,
    to: 1,
    entrance: "fade",
  },
  {
    name: "the TP gained",
    blocksOf: () => [...regionOf("Rang").querySelectorAll<HTMLElement>("[data-tp-part=gained]")],
    from: 0.6,
    to: 1,
    entrance: "fill",
  },
  {
    name: "the Records' tiles",
    blocksOf: () => within(regionOf("Records")).getAllByRole("listitem", HIDDEN),
    from: 0.8,
    to: 1.1,
    entrance: "fade",
  },
  {
    name: "the Records' stamps",
    // Those of the first two tiles, the Records beaten: each as its tile lands.
    blocksOf: () => within(regionOf("Records")).getAllByText("Nouveau record"),
    from: 0.9,
    to: 1.05,
    entrance: "fade",
  },
  {
    name: "the tale of the tape's lines",
    blocksOf: () => within(regionOf("Le Duel en chiffres")).getAllByRole("row", HIDDEN).slice(1),
    from: 0.9,
    to: 1.3,
    entrance: "fade",
  },
  {
    name: "the Duel chart",
    blocksOf: () => [regionOf("Le Duel seconde par seconde")],
    from: 1,
    to: 1.3,
    entrance: "fade",
  },
  {
    name: "the buttons",
    blocksOf: () => [screen.getByRole("navigation", { name: "Après le Duel", ...HIDDEN })],
    from: 1.1,
    to: 1.4,
    entrance: "fade",
  },
];

// The whole entrance, over.
const ENTRANCE_END = 1.4;

// What comes in after the outcome and the band: all that a Tier-up holds back.
const RESTING = ENTRANCE.filter(
  ({ name }) => name !== "the outcome" && !name.startsWith("the band"),
);

const blocksOfAll = () => ENTRANCE.flatMap(({ blocksOf }) => blocksOf());

describe("the entrance", () => {
  test.each(ENTRANCE)(
    "$name comes in from $from s to $to s",
    async ({ blocksOf, from, to, entrance }) => {
      await renderEnded(AFFICHE);

      const blocks = blocksOf();
      const before = Math.max(0, from - 0.02);

      expect(blocks.length).toBeGreaterThan(0);
      await clock.advance(before);
      expect(blocks.map(STARTS[entrance])).toEqual(blocks.map(() => true));

      await clock.advance(to + 0.02 - before);
      expect(blocks.map(ENDS[entrance])).toEqual(blocks.map(() => true));
    },
  );

  test("under reduced motion, the Affiche is there at once", async () => {
    reduceMotion();

    await renderEnded(AFFICHE);

    const blocks = blocksOfAll();

    expect(blocks.map(arrived)).toEqual(blocks.map(() => true));
  });

  test("its buttons answer while it plays", async () => {
    await renderEnded(AFFICHE);

    await userEvent.click(screen.getByRole("button", { name: "Nouveau Duel" }));
    expect(usePlayStore.getState().play).toBe("duel");

    await userEvent.click(screen.getByRole("button", { name: "Retour au Solo" }));
    expect(usePlayStore.getState().play).toBe("solo");
    expect(screen.getByRole("button", { name: "Revoir" })).toHaveAttribute(
      "href",
      "/history/duel-1",
    );
  });

  test("a Tier-up opens once the outcome and the band are in, the rest waiting under it", async () => {
    await renderEnded({ ...AFFICHE, ranked: intoGold });

    const first = [outcomeBlock(), regionOf("Score")];

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(first.map(arrived)).toEqual(first.map(() => true));

    const rest = RESTING.flatMap(({ blocksOf, entrance }) =>
      blocksOf().map((block) => ({ block, entrance })),
    );

    const waiting = () => rest.map(({ block, entrance }) => STARTS[entrance](block));

    await clock.advance(10);
    expect(waiting()).toEqual(rest.map(() => true));
  });

  test("the rest comes in only as the Tier-up closes, the focus back on the screen", async () => {
    await renderEnded({ ...AFFICHE, ranked: intoGold });

    const rest = RESTING.flatMap(({ blocksOf, entrance }) =>
      blocksOf().map((block) => ({ block, entrance })),
    );

    await clock.advance(10);
    await userEvent.click(continueButton());
    await waitFor(() => expect(endScreen()).toHaveFocus());
    expect(rest.map(({ block, entrance }) => STARTS[entrance](block))).toEqual(
      rest.map(() => true),
    );

    await clock.advance(ENTRANCE_END);
    expect(rest.map(({ block }) => arrived(block))).toEqual(rest.map(() => true));
    expect(regionOf("Rang")).toHaveTextContent("+25 TP");
  });

  test("the focus back on the screen never scrolls the page", async () => {
    await renderEnded({ ...AFFICHE, ranked: intoGold });

    await clock.advance(10);

    const focus = vi.spyOn(HTMLElement.prototype, "focus");

    await userEvent.click(continueButton());
    await waitFor(() => expect(endScreen()).toHaveFocus());
    expect(focusCallsOn(endScreen(), focus)).toEqual([[{ preventScroll: true }]]);
  });

  test("never opens a Tier-up before the band and the outcome are in", async () => {
    await renderEnded({ ...AFFICHE, ranked: intoGold, untilTierUp: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await clock.advance(TIER_UP_AT - 0.05);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await clock.advance(0.06);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  test("under reduced motion, a Tier-up opens at once over the Duel end, there whole", async () => {
    reduceMotion();

    await renderEnded({ ...AFFICHE, ranked: intoGold });

    const blocks = blocksOfAll();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(blocks.map(arrived)).toEqual(blocks.map(() => true));
  });

  test("leaves nothing behind once gone", async () => {
    await renderEnded(AFFICHE);
    await clock.advance(0.5);

    const blocks = blocksOfAll();

    cleanup();

    expect(blocks.map(arrived)).toEqual(blocks.map(() => true));
    expect(gsap.globalTimeline.getChildren()).toEqual([]);
  });
});

// The HUD's Score band as the Duel ended, at the top of the Duel's scene, its slant at 72 % by
// Ada's Lead: recorded as the HUD records it, then gone with the HUD.
const recordHudBand = () => {
  const band = document.createElement("section");

  band.setAttribute("data-duel-band", "");
  band.innerHTML = "<div data-band-fill></div><p>1 284</p>";
  document.body.append(band);
  vi.spyOn(band, "getBoundingClientRect").mockReturnValue(new DOMRect(112, 80, 1216, 112));
  recordBandMorph(72);
  band.remove();
};

// The copy of the HUD's figures, fading out over the Duel end.
const hudGhost = () => document.querySelector<HTMLElement>("[data-band-ghost]");

const scoreBand = () => regionOf("Score");

const bandFigures = () => {
  const figures = scoreBand().querySelector<HTMLElement>("[data-band-figures]");

  expect(figures).not.toBeNull();

  return figures ?? document.body;
};

describe("the entrance out of the HUD's band", () => {
  afterEach(() => {
    forgetBandMorph();
  });

  test("the band starts on the HUD's box, its slant at the Lead's, the HUD's figures over it", async () => {
    recordHudBand();
    await renderEnded(AFFICHE);

    expect(gsap.getProperty(scoreBand(), "x")).toBe(112);
    expect(gsap.getProperty(scoreBand(), "y")).toBe(80);
    expect(scoreBand().style.getPropertyValue("--share-from")).toBe("72");
    expect(scoreBand().style.getPropertyValue("--share-in")).toBe("0");
    // It never comes in as a block of its own: it is there from the start.
    expect(scoreBand().style.opacity).toBe("");
    expect(bandFigures().style.opacity).toBe("0");
    expect(hudGhost()).toHaveTextContent("1 284");
    expect(hudGhost()).toHaveAttribute("aria-hidden", "true");
    // The rest comes in as ever.
    expect(outcomeBlock().style.opacity).toBe("0");
  });

  test("lands in its place, the rest around it: the Duel end complete once in", async () => {
    recordHudBand();
    await renderEnded(AFFICHE);

    await clock.advance(0.25);
    expect(hudGhost()).toBeNull();

    await clock.advance(ENTRANCE_END);

    const blocks = blocksOfAll();

    expect(blocks.map(arrived)).toEqual(blocks.map(() => true));
    expect(scoreBand().style.transform).toBe("");
    expect(scoreBand().style.getPropertyValue("--share-from")).toBe("");
    expect(bandFigures().style.opacity).toBe("");
  });

  test("under reduced motion, the HUD's figures fade out briefly over the Duel end, there at once", async () => {
    reduceMotion();
    recordHudBand();
    await renderEnded(AFFICHE);

    const blocks = blocksOfAll();

    expect(blocks.map(arrived)).toEqual(blocks.map(() => true));
    expect(gsap.getProperty(scoreBand(), "x")).toBe(0);
    expect(hudGhost()).not.toBeNull();

    await clock.advance(0.3);
    expect(hudGhost()).toBeNull();
  });

  test("leaves nothing behind once gone, halfway through", async () => {
    recordHudBand();
    await renderEnded(AFFICHE);
    await clock.advance(0.1);

    const band = scoreBand();

    cleanup();

    expect(hudGhost()).toBeNull();
    expect(band.style.transform).toBe("");
    expect(gsap.globalTimeline.getChildren()).toEqual([]);
  });

  test("a band leads to one Duel end only", async () => {
    recordHudBand();
    await renderEnded(AFFICHE);
    cleanup();
    await renderEnded(AFFICHE);

    expect(scoreBand().style.getPropertyValue("--share-from")).toBe("");
    expect(hudGhost()).toBeNull();
  });
});
