import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { gsap } from "gsap";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import type { FaceOffSound, FaceOffSounds } from "@/audio/face-off-sounds";
import { FaceOff } from "@/components/face-off/face-off";
import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import { FaceOffSoundsContext } from "@/components/face-off/face-off-sounds-context";
import { ClockContext } from "@/components/run/clock-context";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

const STARTS_AT = 10_000;

const alan = { handle: "alan", image: null };

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
};

let now = 0;

const clock = () => now;

// A Challenge: ranked for neither, Ada's Form from the Queue, none for Alan.
const challenge: FaceOffPairing = {
  selfRank: null,
  opponentRank: null,
  selfForm: { avgWpm: 80, outcomes: ["win", "loss"] },
  opponentForm: null,
  selfStake: null,
};

const orIv = (tp: number) => ({ tier: "or", division: 4, tp, shielded: false }) as const;

const ferIv = (tp: number) => ({ tier: "fer", division: 4, tp, shielded: false }) as const;

const maitre = (tp: number) => ({ tier: "maitre", tp, shielded: false }) as const;

// A ranked Duel between equals, at the MMR their rank expects: 20 TP either way.
const ranked: FaceOffPairing = {
  selfRank: orIv(50),
  opponentRank: orIv(30),
  selfForm: null,
  opponentForm: null,
  selfStake: { win: { tp: 20, standing: orIv(70) }, loss: { tp: -20, standing: orIv(30) } },
};

const stakeCard = () => screen.getByRole("region", { name: "Enjeu" });

// What a win would add to the Stake's bar: only seen, so found by the part the timeline animates.
const stakeGain = () => {
  const gain = stakeCard().querySelector('[data-face-off="stake-gain"]');

  if (gain === null) {
    throw new Error("The Stake has no bar");
  }

  return gain;
};

// A sound player for the tests: it writes down what it plays.
const fakeSounds = () => {
  const played: FaceOffSound[] = [];

  const sounds: FaceOffSounds = {
    unlock: () => {},
    play: (sound) => {
      played.push(sound);
    },
  };

  return { sounds, played };
};

const storageKey = "typomaniac-face-off-sound";

// Every test starts on a first visit: nothing stored, the sound on.
beforeEach(() => {
  localStorage.clear();
  useFaceOffSoundStore.setState(useFaceOffSoundStore.getInitialState());
});

afterEach(() => {
  vi.restoreAllMocks();
});

const unavailable = () => {
  throw new DOMException("The storage is disabled.", "SecurityError");
};

// Reloads the page: the store starts over from its defaults, then reads what is stored. Resetting
// the store writes its defaults down, so what was stored is put back first.
const reload = async () => {
  const stored = localStorage.getItem(storageKey);

  useFaceOffSoundStore.setState(useFaceOffSoundStore.getInitialState());

  if (stored !== null) {
    localStorage.setItem(storageKey, stored);
  }

  await useFaceOffSoundStore.persist.rehydrate();
};

// A frame of the animation, `elapsed` ms into the Duel: the timeline follows the Duel's clock.
const tickAt = (elapsed: number) => {
  now = STARTS_AT + elapsed;
  gsap.ticker.tick();
};

// The Face-off as the Duel shows it, `elapsed` ms into the Duel, the tab's clock on the same time.
const faceOffAt = (elapsed: number, pairing = challenge, sounds = fakeSounds().sounds) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  now = STARTS_AT + elapsed;

  const face = (at: number, startsAt: number) => (
    <QueryClientProvider client={queryClient}>
      <FaceOffSoundsContext value={sounds}>
        <ClockContext value={clock}>
          <FaceOff opponent={alan} pairing={pairing} startsAt={startsAt} elapsed={at} />
        </ClockContext>
      </FaceOffSoundsContext>
    </QueryClientProvider>
  );

  const { rerender } = render(face(elapsed, STARTS_AT));

  return {
    at: (next: number) => {
      now = STARTS_AT + next;
      rerender(face(next, STARTS_AT));
    },
    // A `duel-resumed` sets the start again, from the server's clock: a few ms off, at the same
    // time of the tab.
    resumed: (startsAt: number) => rerender(face(now - startsAt, startsAt)),
  };
};

describe("FaceOff", () => {
  test("shows both players during the Countdown, with the Challenge badge on each side", () => {
    faceOffAt(-4500);

    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText("@alan")).toBeInTheDocument();
    expect(screen.getAllByText("Challenge")).toHaveLength(2);
  });

  test("shows each player's rank and Form, absent for one without a Ranked Duel", () => {
    faceOffAt(-4500, {
      selfRank: { tier: "or", division: 2, tp: 42, shielded: false },
      opponentRank: { placementsLeft: 3 },
      selfForm: { avgWpm: 80, outcomes: ["win", "loss"] },
      opponentForm: null,
      selfStake: null,
    });

    expect(screen.getByText("Or II · 42 TP")).toBeInTheDocument();
    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(screen.getByText("Victoire")).toBeInTheDocument();
    expect(screen.getByText("Défaite")).toBeInTheDocument();
    expect(screen.getByText("80 wpm")).toBeInTheDocument();
    expect(screen.getByText("Aucun Duel classé")).toBeInTheDocument();
  });

  test("shows this User's Stake under their rank: the bar, what a win and a loss would do", () => {
    // Past the reveal, the Stake in with the rest.
    faceOffAt(-3500, ranked);

    const card = stakeCard();

    expect(card).toHaveTextContent("En jeu");
    expect(card).toHaveTextContent("50 / 100 TP");
    expect(card).toHaveTextContent("Victoire +20 TP → Or IV · 70 TP");
    // The last line, with nothing after its TP.
    expect(card).toHaveTextContent(/Défaite −20 TP$/);
    expect(within(card).getByText("+20 TP")).toHaveClass("text-win");
    expect(within(card).getByText("−20 TP")).toHaveClass("text-destructive");
  });

  test("heads the Stake with the rank a win would reach when it moves up", () => {
    faceOffAt(-3500, {
      ...ranked,
      selfRank: orIv(91),
      selfStake: {
        win: { tp: 20, standing: { tier: "or", division: 3, tp: 11, shielded: true } },
        loss: { tp: -20, standing: orIv(71) },
      },
    });

    const card = stakeCard();

    expect(card).toHaveTextContent("Gagne et passe Or III");
    expect(card).not.toHaveTextContent("En jeu");
    expect(card).toHaveTextContent("Victoire +20 TP → Or III · 11 TP");
  });

  test("says what a loss would do to the rank: down, held by the shield, or kept by a move up", () => {
    faceOffAt(-3500, {
      ...ranked,
      selfRank: { tier: "or", division: 2, tp: 8, shielded: false },
      selfStake: {
        win: { tp: 12, standing: { tier: "or", division: 2, tp: 20, shielded: false } },
        loss: { tp: -12, standing: { tier: "or", division: 3, tp: 75, shielded: false } },
      },
    });
    expect(stakeCard()).toHaveTextContent("Défaite −12 TP → Or III · 75 TP");
    cleanup();

    faceOffAt(-3500, {
      ...ranked,
      selfRank: { tier: "or", division: 2, tp: 4, shielded: true },
      selfStake: {
        win: { tp: 12, standing: { tier: "or", division: 2, tp: 16, shielded: true } },
        loss: { tp: -12, standing: { tier: "or", division: 2, tp: 0, shielded: false } },
      },
    });
    expect(stakeCard()).toHaveTextContent("Défaite −12 TP, protégé : tu restes Or II");
    cleanup();

    faceOffAt(-3500, {
      ...ranked,
      selfRank: { tier: "or", division: 1, tp: 92, shielded: false },
      selfStake: {
        win: { tp: 14, standing: { tier: "platine", division: 4, tp: 6, shielded: true } },
        loss: { tp: -11, standing: { tier: "or", division: 1, tp: 81, shielded: false } },
      },
    });
    expect(stakeCard()).toHaveTextContent("Défaite −11 TP, tu restes Or I");
  });

  test("in Fer IV, says a loss below 0 TP stays there", () => {
    faceOffAt(-3500, {
      ...ranked,
      selfRank: ferIv(6),
      selfStake: { win: { tp: 14, standing: ferIv(20) }, loss: { tp: -12, standing: ferIv(0) } },
    });

    expect(stakeCard()).toHaveTextContent("Défaite −12 TP, tu restes Fer IV · 0 TP");
  });

  test("in Maître, the Stake has no bar: TP without a cap", () => {
    faceOffAt(-3500, {
      ...ranked,
      selfRank: maitre(248),
      selfStake: {
        win: { tp: 11, standing: maitre(259) },
        loss: { tp: -11, standing: maitre(237) },
      },
    });

    const card = stakeCard();

    expect(card).toHaveTextContent("En jeu");
    expect(card).toHaveTextContent("Victoire +11 TP → Maître · 259 TP");
    expect(card).toHaveTextContent(/Défaite −11 TP$/);
    expect(card).not.toHaveTextContent("/ 100 TP");
    expect(card.querySelector('[data-face-off="stake-gain"]')).toBeNull();
  });

  test("in Maître, a loss that moves down leads to Diamant I at 75 TP", () => {
    faceOffAt(-3500, {
      ...ranked,
      selfRank: maitre(5),
      selfStake: {
        win: { tp: 11, standing: maitre(16) },
        loss: { tp: -11, standing: { tier: "diamant", division: 1, tp: 75, shielded: false } },
      },
    });

    expect(stakeCard()).toHaveTextContent("Défaite −11 TP → Diamant I · 75 TP");
  });

  test("shows no Stake in Placement nor in a Challenge", () => {
    faceOffAt(-3500, { ...ranked, selfRank: { placementsLeft: 2 }, selfStake: null });
    expect(screen.queryByRole("region", { name: "Enjeu" })).not.toBeInTheDocument();
    cleanup();

    faceOffAt(-3500);
    expect(screen.queryByRole("region", { name: "Enjeu" })).not.toBeInTheDocument();
  });

  test("fills what a win would add to the bar a little after the Stake comes in", () => {
    // Just in, with the reveal: the bar is still to fill.
    faceOffAt(-3800, ranked);
    expect(gsap.getProperty(stakeGain(), "scaleX")).toBe(0);

    tickAt(-2500);
    expect(gsap.getProperty(stakeGain(), "scaleX")).toBe(1);
  });

  test("a Face-off resumed during the 3-2-1 finds the Stake as it stands, its bar filled", () => {
    faceOffAt(-2000, ranked);

    expect(stakeCard()).toHaveTextContent("Victoire +20 TP → Or IV · 70 TP");
    expect(gsap.getProperty(stakeGain(), "scaleX")).toBe(1);
  });

  test("under reduced motion, the bar shows what a win would add without filling in", () => {
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

    faceOffAt(-3800, ranked);

    expect(gsap.getProperty(stakeGain(), "scaleX")).toBe(1);
  });

  test("waits for the Countdown: nothing in the second of « C'est parti ! » before it", () => {
    const face = faceOffAt(-5500);

    expect(screen.queryByText("@alan")).not.toBeInTheDocument();

    face.at(-4500);
    expect(screen.getByText("@alan")).toBeInTheDocument();
  });

  test("slides each player's Handle, repeated, behind their panel", () => {
    faceOffAt(-4500);

    expect(screen.getAllByText(/^ada · ada · /)).not.toHaveLength(0);
    expect(screen.getAllByText(/^alan · alan · /)).not.toHaveLength(0);
  });

  test("falls back on the initials of a player without an avatar", () => {
    faceOffAt(-4500);

    expect(screen.getAllByText("A")).toHaveLength(2);
  });

  test("announces the Countdown in its live region", () => {
    const faceOff = faceOffAt(-4500);

    expect(screen.getByRole("status")).toHaveTextContent("Duel contre @alan");

    faceOff.at(-1500);
    expect(screen.getByRole("status")).toHaveTextContent(/^2$/);
  });

  test("stays over the start for its exit, then goes", () => {
    const faceOff = faceOffAt(-100);

    faceOff.at(200);
    expect(screen.getByText("@alan")).toBeInTheDocument();

    faceOff.at(1000);
    expect(screen.queryByText("@alan")).not.toBeInTheDocument();
  });

  test("never shows in a Duel resumed after its start", () => {
    faceOffAt(200);

    expect(screen.queryByText("@alan")).not.toBeInTheDocument();
  });
});

describe("FaceOff sounds", () => {
  test("whooshes as the panels come in, at the pairing", () => {
    const { sounds, played } = fakeSounds();

    faceOffAt(-4500, challenge, sounds);

    expect(played).toEqual(["whoosh"]);
  });

  test("plays the impact, a beep on each digit of the 3-2-1 and GO, each in its time", () => {
    const { sounds, played } = fakeSounds();

    faceOffAt(-4500, challenge, sounds);
    tickAt(-4100);
    expect(played).toEqual(["whoosh", "impact"]);

    tickAt(-3000);
    tickAt(-2000);
    tickAt(-1000);
    expect(played).toEqual(["whoosh", "impact", "beep", "beep", "beep"]);

    tickAt(0);
    tickAt(100);
    expect(played).toEqual(["whoosh", "impact", "beep", "beep", "beep", "go"]);
  });

  test("a Face-off joined mid-Countdown plays none of the sounds already past", () => {
    const { sounds, played } = fakeSounds();

    faceOffAt(-2200, challenge, sounds);
    expect(played).toEqual([]);

    tickAt(-1950);
    expect(played).toEqual(["beep"]);
  });

  test("a duel-resumed seeks the Face-off without playing again what was heard", () => {
    const { sounds, played } = fakeSounds();
    const faceOff = faceOffAt(-4500, challenge, sounds);

    tickAt(-4100);
    tickAt(-3000);
    expect(played).toEqual(["whoosh", "impact", "beep"]);

    // The server's start lands 30 ms later on this tab: the playhead goes back, then over the 3
    // again.
    faceOff.resumed(STARTS_AT + 30);
    tickAt(-2950);
    expect(played).toEqual(["whoosh", "impact", "beep"]);
  });
});

const muteButton = () => screen.getByRole("button", { name: "Couper le son" });

describe("FaceOff mute", () => {
  test("the sound is on at first, and muting silences the rest of the Face-off", async () => {
    const { sounds, played } = fakeSounds();

    faceOffAt(-4500, challenge, sounds);
    expect(muteButton()).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(muteButton());
    tickAt(-4100);

    expect(muteButton()).toHaveAttribute("aria-pressed", "true");
    expect(played).toEqual(["whoosh"]);
  });

  test("the mute is kept from one Duel to the next", async () => {
    faceOffAt(-4500);
    await userEvent.click(muteButton());
    cleanup();
    await reload();

    const { sounds, played } = fakeSounds();

    faceOffAt(-4500, challenge, sounds);

    expect(muteButton()).toHaveAttribute("aria-pressed", "true");
    expect(played).toEqual([]);

    await userEvent.click(muteButton());
    tickAt(-4100);

    expect(played).toEqual(["impact"]);
  });

  test("an unavailable storage keeps the sound on, and muting still works", async () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(unavailable);
    vi.spyOn(localStorage, "setItem").mockImplementation(unavailable);
    await useFaceOffSoundStore.persist.rehydrate();

    const { sounds, played } = fakeSounds();

    faceOffAt(-4500, challenge, sounds);
    await userEvent.click(muteButton());
    tickAt(-4100);

    expect(played).toEqual(["whoosh"]);
  });
});
