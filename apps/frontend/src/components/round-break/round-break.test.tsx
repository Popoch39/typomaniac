import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { meQueryOptions } from "@/api/me";
import { ForcedReducedMotionContext } from "@/components/motion/reduced-motion-context";
import { RoundBreak, type RoundBreakDuel } from "@/components/round-break/round-break";
import { GO_AT, ROUND_BREAK_TIMES } from "@/components/round-break/round-break-timeline";
import { ClockContext } from "@/components/run/clock-context";
import type { NextRound, PlayedRound } from "@/stores/duel-store";
import { useLocaleStore } from "@/stores/locale-store";
import { holdGsapClock } from "@/test/gsap-clock";
import { ada } from "@/test/render-app";

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const played = (
  index: number,
  outcome: PlayedRound["outcome"],
  score: number,
  opponentScore: number,
): PlayedRound => ({
  index,
  outcome,
  result: noResult,
  opponentResult: noResult,
  score: { score, bestCombo: 0, bursts: 0 },
  opponentScore: { score: opponentScore, bestCombo: 0, bursts: 0 },
});

// The next Round starts at 100 s on the tab's clock.
const STARTS_AT = 100_000;

const next = (index: number): NextRound => ({ index, seed: 9, startsAt: STARTS_AT });

const duelWith = (
  rounds: PlayedRound[],
  roundsWon: number,
  opponentRoundsWon: number,
): RoundBreakDuel => ({
  opponent: { handle: "kaori_42", image: null, ornament: null },
  selfOrnament: null,
  roundsToWin: 2,
  rounds,
  roundsWon,
  opponentRoundsWon,
  connected: true,
});

let gsapClock = holdGsapClock();

beforeEach(() => {
  gsapClock = holdGsapClock();
});

afterEach(() => {
  cleanup();
  gsapClock.release();
  useLocaleStore.setState({ locale: "fr" });
});

// The Round break before `upcoming`, the tab's clock `at` ms from the start of the Round break.
const renderBreak = (
  duel: RoundBreakDuel,
  upcoming: NextRound,
  at = GO_AT * 1000,
  reduced = false,
) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, ada);

  const now = STARTS_AT - GO_AT * 1000 + at;

  render(
    <QueryClientProvider client={queryClient}>
      <ForcedReducedMotionContext value={reduced}>
        <ClockContext value={() => now}>
          <RoundBreak duel={duel} next={upcoming} onLeave={() => {}} />
        </ClockContext>
      </ForcedReducedMotionContext>
    </QueryClientProvider>,
  );
};

const card = (index: number) => document.querySelector<HTMLElement>(`[data-rb="slot-${index}"]`);

const opacityOf = (selector: string) =>
  document.querySelector<HTMLElement>(selector)?.style.opacity;

describe("the Round break", () => {
  test("after a first Round won: its card for this User, the second to play, the third if needed", () => {
    renderBreak(duelWith([played(0, "win", 1284, 1102)], 1, 0), next(1));

    const board = screen.getByRole("region", { name: "Entre deux manches" });

    expect(within(board).getByText("Manches : 1 à 0")).toBeInTheDocument();

    const first = card(0);

    expect(first?.querySelector('[data-rb="flip"]')).not.toBeNull();
    expect(first).toHaveTextContent("Manche 1");
    expect(first).toHaveTextContent("Toi");
    expect(first).toHaveTextContent("remporte la manche");
    expect(first).toHaveTextContent("1 284");
    expect(first).toHaveTextContent("contre 1 102");
    expect(first).toHaveTextContent("+182");
    expect(card(1)?.querySelector('[data-rb="next"]')).not.toBeNull();
    expect(card(1)).toHaveTextContent("à jouer");
    expect(card(2)).toHaveTextContent("si besoin");
    expect(within(board).getByText("Manche 2")).toBeInTheDocument();
    expect(within(board).getByText("Le texte se dévoile au GO")).toBeInTheDocument();
  });

  test("a Round won by the opponent is in their name, and their figure jumps", () => {
    renderBreak(duelWith([played(0, "loss", 1047, 1216)], 0, 1), next(1));

    expect(card(0)).toHaveTextContent("@kaori_42");
    expect(card(0)).toHaveTextContent("1 216");
    expect(document.querySelector('[data-rb="count-new"]')).toHaveTextContent("1");
    expect(document.querySelector('[data-rb="count-old"]')).toHaveTextContent("0");
  });

  test("a drawn Round shows a neutral card, both Scores, no gap, and no figure jumps", () => {
    renderBreak(duelWith([played(0, "draw", 640, 640)], 0, 0), next(1));

    expect(card(0)).toHaveTextContent("Manche nulle");
    expect(card(0)).toHaveTextContent("contre 640");
    expect(card(0)).not.toHaveTextContent("+");
    expect(card(0)).not.toHaveTextContent("remporte");
    expect(document.querySelector('[data-rb="count-new"]')).toBeNull();
  });

  test("at 1-1, the caption and the third card announce the deciding Round", () => {
    renderBreak(
      duelWith([played(0, "loss", 1047, 1216), played(1, "win", 1309, 1158)], 1, 1),
      next(2),
    );

    expect(card(2)).toHaveTextContent("décisive");
    expect(screen.getByText("Manche décisive")).toBeInTheDocument();
    expect(screen.getByText("1 partout, la suivante prend tout")).toBeInTheDocument();
    // The first Round is shown turned already, the second turns now.
    expect(card(0)?.querySelector('[data-rb="done"]')).not.toBeNull();
    expect(card(1)?.querySelector('[data-rb="flip"]')).not.toBeNull();
  });

  test("its moments run on the Duel's clock, the GO whole at the next Round's start", () => {
    const duel = duelWith([played(0, "win", 500, 400)], 1, 0);

    renderBreak(duel, next(1), 0);
    expect(opacityOf('[data-rb="slot-0"]')).toBe("0");
    expect(opacityOf('[data-rb="go"]')).toBe("0");
    cleanup();

    // Joined halfway: past the rise of the cards, before the caption.
    renderBreak(duel, next(1), (ROUND_BREAK_TIMES.rise[2] + ROUND_BREAK_TIMES.riseFor) * 1000);
    expect(opacityOf('[data-rb="slot-2"]')).toBe("1");
    expect(opacityOf('[data-rb="caption"]')).toBe("0");
    cleanup();

    // During the 2.
    renderBreak(duel, next(1), (ROUND_BREAK_TIMES.countdown[1] + 0.2) * 1000);
    expect(opacityOf('[data-rb="count-2"]')).toBe("1");
    expect(opacityOf('[data-rb="count-3"]')).toBe("0");
    expect(opacityOf('[data-rb="caption"]')).toBe("1");
    cleanup();

    renderBreak(duel, next(1));
    expect(opacityOf('[data-rb="go"]')).toBe("1");
    expect(opacityOf('[data-rb="count-1"]')).toBe("0");
  });

  test("under reduced motion, the same moments in fades: no rise, no turn", () => {
    const duel = duelWith([played(0, "win", 500, 400)], 1, 0);

    renderBreak(duel, next(1), 0, true);

    const slot = document.querySelector<HTMLElement>('[data-rb="slot-0"]');
    const back = document.querySelector<HTMLElement>('[data-rb="flip"] [data-rb="back"]');
    const turn = document.querySelector<HTMLElement>('[data-rb="flip"] [data-rb="turn"]');

    expect(slot?.style.opacity).toBe("0");
    // Faded in where it stands, never lowered to rise.
    expect(slot?.style.transform ?? "").not.toContain("70px");
    // Its back already faces the User and the card never turns: the faces cross-fade.
    // (an inline transform without a turn, over the class that turns it 180°).
    expect(back?.style.transform).toBe("translate(0, 0)");
    expect(turn?.style.transform ?? "").not.toContain("rotateY");
    cleanup();

    // During the 2, as with the motion.
    renderBreak(duel, next(1), (ROUND_BREAK_TIMES.countdown[1] + 0.2) * 1000, true);
    expect(document.querySelector<HTMLElement>('[data-rb="count-2"]')?.style.opacity).toBe("1");
  });

  test("in English, it says Round", () => {
    useLocaleStore.setState({ locale: "en" });
    renderBreak(
      duelWith([played(0, "loss", 1047, 1216), played(1, "win", 1309, 1158)], 1, 1),
      next(2),
    );

    const board = screen.getByRole("region", { name: "Between two Rounds" });

    expect(within(board).getByText("Rounds: 1 to 1")).toBeInTheDocument();
    expect(card(1)).toHaveTextContent("Round 2");
    expect(card(1)).toHaveTextContent("You");
    expect(card(1)).toHaveTextContent("takes the round");
    expect(card(2)).toHaveTextContent("deciding");
    expect(screen.getByText("Deciding round")).toBeInTheDocument();
    expect(board).not.toHaveTextContent(/Manche|remporte|contre|décisive/);
  });
});
