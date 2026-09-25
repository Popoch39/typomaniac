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
    });

    expect(screen.getByText("Or II · 42 TP")).toBeInTheDocument();
    expect(screen.getByText("Placement · 3 Duels restants")).toBeInTheDocument();
    expect(screen.getByText("Victoire")).toBeInTheDocument();
    expect(screen.getByText("Défaite")).toBeInTheDocument();
    expect(screen.getByText("80 wpm")).toBeInTheDocument();
    expect(screen.getByText("Aucun Duel classé")).toBeInTheDocument();
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
