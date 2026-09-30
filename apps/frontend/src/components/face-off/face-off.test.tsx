import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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
import { useLocaleStore } from "@/stores/locale-store";

const STARTS_AT = 10_000;

const alan = { handle: "alan", image: null, ornament: "platinum" } as const;

// The Ornament worn in a side's panel, within what its timeline moves in and out.
const ornamentIn = (side: string) =>
  document
    .querySelector(`[data-face-off="${side}"] [data-face-off="reveal"] [data-ornament] use`)
    ?.getAttribute("href");

const me: Me = {
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

let now = 0;

const clock = () => now;

// A Challenge: ranked for neither, Ada's Form from the Queue, none for Alan.
const challenge: FaceOffPairing = {
  selfOrnament: null,
  selfRank: null,
  opponentRank: null,
  selfForm: { avgWpm: 80, outcomes: ["win", "loss"] },
  opponentForm: null,
  selfStake: null,
};

const goldIv = (tp: number) => ({ tier: "gold", division: 4, tp, shielded: false }) as const;

const ironIv = (tp: number) => ({ tier: "iron", division: 4, tp, shielded: false }) as const;

const maniac = (tp: number) => ({ tier: "maniac", tp, shielded: false }) as const;

// A ranked Duel between equals, at the MMR their rank expects: 20 TP either way.
const ranked: FaceOffPairing = {
  selfOrnament: "gold",
  selfRank: goldIv(50),
  opponentRank: goldIv(30),
  selfForm: null,
  opponentForm: null,
  selfStake: { win: { tp: 20, standing: goldIv(70) }, loss: { tp: -20, standing: goldIv(30) } },
};

const goldI = (tp: number) => ({ tier: "gold", division: 1, tp, shielded: false }) as const;

const diamondI = (tp: number) => ({ tier: "diamond", division: 1, tp, shielded: false }) as const;

// A win moves Ada from Gold I up to Platinum IV: a Promotion Duel.
const promotion: FaceOffPairing = {
  ...ranked,
  selfRank: goldI(91),
  selfStake: {
    win: { tp: 14, standing: { tier: "platinum", division: 4, tp: 5, shielded: true } },
    loss: { tp: -11, standing: goldI(80) },
  },
};

// A win moves Ada from Diamond I into Maniac.
const forManiac: FaceOffPairing = {
  ...ranked,
  selfRank: diamondI(95),
  selfStake: {
    win: { tp: 9, standing: { tier: "maniac", tp: 4, shielded: true } },
    loss: { tp: -16, standing: diamondI(79) },
  },
};

// A win moves Ada up a Division only, from Gold III to Gold II.
const division: FaceOffPairing = {
  ...ranked,
  selfRank: { tier: "gold", division: 3, tp: 94, shielded: false },
  selfStake: {
    win: { tp: 12, standing: { tier: "gold", division: 2, tp: 6, shielded: true } },
    loss: { tp: -13, standing: { tier: "gold", division: 3, tp: 81, shielded: false } },
  },
};

// The Promotion Duel's banner, found by its title.
const banner = () => screen.queryByText(/^Duel (de promotion|pour Maniac)$/);

// Only seen, around the disc: found by the part the timeline shows.
const ring = () => document.querySelector('[data-face-off="ring"]');

// The banner's whole pill, which the timeline moves in and out.
const bannerPart = () => {
  const part = document.querySelector('[data-face-off="banner"]');

  if (part === null) {
    throw new Error("No Promotion Duel banner");
  }

  return part;
};

const discPart = () => {
  const part = document.querySelector('[data-face-off="disc"]');

  if (part === null) {
    throw new Error("No disc");
  }

  return part;
};

// The User prefers reduced motion: the Face-off reads it when its timeline is built.
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

const stakeLine = () => screen.getByRole("region", { name: "Enjeu" });

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

  test("each avatar wears its player's Ornament, in the panel that moves it", () => {
    faceOffAt(-4500, ranked);

    expect(ornamentIn("own")).toBe("#tier-ornament-gold");
    expect(ornamentIn("opponent")).toBe("#tier-ornament-platinum");
  });

  test("without an Ornament, the avatar wears none", () => {
    faceOffAt(-4500);

    expect(document.querySelector('[data-face-off="own"] [data-ornament]')).toBeNull();
  });

  test("shows each player's rank and Form, absent for one without a Ranked Duel", () => {
    faceOffAt(-4500, {
      selfOrnament: "gold",
      selfRank: { tier: "gold", division: 2, tp: 42, shielded: false },
      opponentRank: { placementsLeft: 3 },
      selfForm: { avgWpm: 80, outcomes: ["win", "loss"] },
      opponentForm: null,
      selfStake: null,
    });

    expect(screen.getByText("Gold II · 42 TP")).toBeInTheDocument();
    // The rank carries its Emblem, never the Blason: that one is for the large formats.
    expect(document.querySelector('use[href="#tier-emblem-gold"]')).not.toBeNull();
    expect(document.querySelector("[data-tier-blason]")).toBeNull();
    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(screen.getByText("Victoire")).toBeInTheDocument();
    expect(screen.getByText("Défaite")).toBeInTheDocument();
    expect(screen.getByText("80 wpm")).toBeInTheDocument();
    expect(screen.getByText("Aucun Duel classé")).toBeInTheDocument();
  });

  test("shows this User's Stake under their rank: the TP a win and a loss would move", () => {
    // Past the reveal, the Stake in with the rest.
    faceOffAt(-3500, ranked);

    expect(stakeLine()).toHaveTextContent(/^Victoire \+20 TP Défaite −20 TP$/);
  });

  test("keeps the Stake to its TP, never the rank it leads to", () => {
    const moves: [FaceOffPairing, RegExp][] = [
      // A win up a Division.
      [division, /^Victoire \+12 TP Défaite −13 TP$/],
      // A loss down a Division.
      [
        {
          ...ranked,
          selfRank: { tier: "gold", division: 2, tp: 8, shielded: false },
          selfStake: {
            win: { tp: 12, standing: { tier: "gold", division: 2, tp: 20, shielded: false } },
            loss: { tp: -14, standing: { tier: "gold", division: 3, tp: 75, shielded: false } },
          },
        },
        /^Victoire \+12 TP Défaite −14 TP$/,
      ],
      // A loss held by the shield.
      [
        {
          ...ranked,
          selfRank: { tier: "gold", division: 2, tp: 4, shielded: true },
          selfStake: {
            win: { tp: 15, standing: { tier: "gold", division: 2, tp: 19, shielded: true } },
            loss: { tp: -12, standing: { tier: "gold", division: 2, tp: 0, shielded: false } },
          },
        },
        /^Victoire \+15 TP Défaite −12 TP$/,
      ],
      // A loss in Iron IV, at its floor.
      [
        {
          ...ranked,
          selfRank: ironIv(6),
          selfStake: {
            win: { tp: 14, standing: ironIv(20) },
            loss: { tp: -16, standing: ironIv(0) },
          },
        },
        /^Victoire \+14 TP Défaite −16 TP$/,
      ],
    ];

    for (const [pairing, stake] of moves) {
      faceOffAt(-3500, pairing);
      expect(stakeLine()).toHaveTextContent(stake);
      cleanup();
    }
  });

  test("in Maniac, the Stake is the same line: TP without a cap", () => {
    faceOffAt(-3500, {
      ...ranked,
      selfRank: maniac(248),
      selfStake: {
        win: { tp: 11, standing: maniac(259) },
        loss: { tp: -11, standing: maniac(237) },
      },
    });

    expect(stakeLine()).toHaveTextContent(/^Victoire \+11 TP Défaite −11 TP$/);
  });

  test("shows no Stake in Placement nor in a Challenge", () => {
    faceOffAt(-3500, { ...ranked, selfRank: { placementsLeft: 2 }, selfStake: null });
    expect(screen.queryByRole("region", { name: "Enjeu" })).not.toBeInTheDocument();
    cleanup();

    faceOffAt(-3500);
    expect(screen.queryByRole("region", { name: "Enjeu" })).not.toBeInTheDocument();
  });

  test("a Face-off resumed during the 3-2-1 still shows the Stake", () => {
    faceOffAt(-2000, ranked);

    expect(stakeLine()).toHaveTextContent(/^Victoire \+20 TP Défaite −20 TP$/);
  });

  test("stages a Promotion Duel: the banner, the rank reached from the rank held, the ring", () => {
    faceOffAt(-3500, promotion);

    expect(bannerPart()).toHaveTextContent("Duel de promotion");
    expect(bannerPart()).toHaveTextContent("Gold I → Platinum IV");
    expect(bannerPart()?.querySelector('use[href="#tier-emblem-platinum"]')).not.toBeNull();
    expect(document.querySelector("[data-tier-blason]")).toBeNull();
    expect(ring()).not.toBeNull();
  });

  test("stages a Duel for Maniac the same way", () => {
    faceOffAt(-3500, forManiac);

    expect(bannerPart()).toHaveTextContent("Duel pour Maniac");
    expect(bannerPart()).toHaveTextContent("Diamond I → Maniac");
    expect(ring()).not.toBeNull();
  });

  test("keeps a move up a Division, an ordinary Duel and a Challenge to the card alone", () => {
    for (const pairing of [division, ranked, challenge]) {
      faceOffAt(-3500, pairing);
      expect(banner()).not.toBeInTheDocument();
      expect(ring()).toBeNull();
      cleanup();
    }
  });

  test("announces a Promotion Duel for what it is", () => {
    faceOffAt(-4500, forManiac);

    expect(screen.getByRole("status")).toHaveTextContent("Duel pour Maniac contre @alan");
  });

  test("brings the banner in with the reveal and takes it out at GO", () => {
    const faceOff = faceOffAt(-4500, promotion);

    expect(gsap.getProperty(bannerPart(), "opacity")).toBe(0);

    tickAt(-3500);
    expect(gsap.getProperty(bannerPart(), "opacity")).toBe(1);
    expect(gsap.getProperty(bannerPart(), "y")).toBe(0);

    faceOff.at(400);
    tickAt(400);
    expect(gsap.getProperty(bannerPart(), "opacity")).toBe(0);
  });

  test("a Face-off resumed during the 3-2-1 finds the banner and the ring where they stand", () => {
    faceOffAt(-2000, promotion);

    expect(gsap.getProperty(bannerPart(), "opacity")).toBe(1);
    expect(gsap.getProperty(bannerPart(), "y")).toBe(0);
    // The ring glows around the disc, shown through the whole 3-2-1.
    expect(ring()?.closest('[data-face-off="disc"]')).not.toBeNull();
    expect(gsap.getProperty(discPart(), "opacity")).toBe(1);
  });

  test("under reduced motion, the banner fades in without moving and its emblem stays still", () => {
    reduceMotion();

    const faceOff = faceOffAt(-4500, promotion);
    const emblem = document.querySelector('[data-face-off="banner-emblem"]');

    expect(gsap.getProperty(bannerPart(), "y")).toBe(0);

    for (const at of [-3700, -3300, -2900, -2500]) {
      faceOff.at(at);
      tickAt(at);
      expect(gsap.getProperty(bannerPart(), "y")).toBe(0);
      expect(emblem === null ? null : gsap.getProperty(emblem, "opacity")).toBe(1);
    }
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

describe("FaceOff in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("a Challenge's badge, the Form and its absence, and the mute", () => {
    faceOffAt(-4500);

    expect(screen.getAllByText("Challenge")).toHaveLength(2);
    expect(screen.getByText("Win")).toBeInTheDocument();
    expect(screen.getByText("Loss")).toBeInTheDocument();
    expect(screen.getByText("80 wpm")).toBeInTheDocument();
    expect(screen.getByText("No Ranked Duels")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeInTheDocument();
  });

  test("the rank, the Placement Duels left and the Stake", () => {
    faceOffAt(-3500, { ...ranked, opponentRank: { placementsLeft: 1 } });

    expect(screen.getByText("Gold IV · 50 TP")).toBeInTheDocument();
    expect(screen.getByText("Placement · 1 Duel left")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Stake" })).toHaveTextContent(
      /^Win \+20 TP Loss −20 TP$/,
    );
  });

  test("stages and announces a Promotion Duel, then one for Maniac", () => {
    faceOffAt(-4500, promotion);

    expect(screen.getByText("Promotion Duel")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Promotion Duel against @alan");

    cleanup();
    faceOffAt(-4500, forManiac);

    expect(screen.getByText("Maniac Promotion Duel")).toBeInTheDocument();
  });

  test("announces the Countdown, then the start", () => {
    const faceOff = faceOffAt(-4500);

    expect(screen.getByRole("status")).toHaveTextContent("Duel against @alan");

    faceOff.at(-1500);
    expect(screen.getByRole("status")).toHaveTextContent(/^2$/);

    faceOff.at(0);
    expect(screen.getByRole("status")).toHaveTextContent("Go!");
  });
});
