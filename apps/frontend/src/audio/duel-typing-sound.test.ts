import type { ClientMessage, ServerMessage } from "api";
import type { Key, Keystroke } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createAudioEngine } from "@/audio/audio-engine";
import { startSoundReactor } from "@/audio/sound-reactor";
import { type DuelSocket, useDuelStore } from "@/stores/duel-store";
import { useSoundStore } from "@/stores/sound-store";
import {
  backspace,
  decoded,
  error,
  fakeOutput,
  key07,
  middle,
  space,
} from "@/test/fake-audio-output";

// Seed 42 in English, version 1, gives "small help while late…" (pinned in the typing-engine tests).
const duel = {
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  startsAt: 3_000,
} as const;

const opponent = { name: "Ada", image: null };

// The server's clock and this tab's agree: the Duel starts at 3 s on both.
const duelFound: ServerMessage = {
  type: "duel-found",
  duel,
  opponent,
  serverTime: 0,
  pace: 40,
  opponentPace: 40,
};

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

const startsAt = duel.startsAt;

const endsAt = startsAt + duel.seconds * 1_000;

// What the store listens to on its socket.
type SocketListeners = {
  message: (event: { data: ServerMessage }) => void;
  close: () => void;
};

// A socket the test speaks for the server through: it hands the store the server's messages and
// drops the connection.
const fakeSocket = () => {
  const sent: ClientMessage[] = [];
  const listeners: SocketListeners = { message: () => {}, close: () => {} };

  const socket: DuelSocket = {
    subscribe: (listener) => {
      listeners.message = listener;
    },
    on: (_, listener) => {
      listeners.close = listener;
    },
    send: (message) => {
      sent.push(message);
    },
    close: () => {},
  };

  return {
    socket,
    sent,
    receive: (data: ServerMessage) => listeners.message({ data }),
    drop: () => listeners.close(),
  };
};

type FakeSocket = ReturnType<typeof fakeSocket>;

// Every socket the store opens, the first one at the connection, then one per reconnection.
let sockets: FakeSocket[] = [];

const server = () => {
  const current = sockets.at(-1);

  if (typeof current === "undefined") {
    throw new Error("No socket opened");
  }

  return current;
};

let now = 0;

// Connects to the Duel, the way the Duel page does: the store opens the fake sockets.
const connect = () => {
  sockets = [];
  now = 0;
  useDuelStore.getState().connect(
    () => now,
    () => {
      const opened = fakeSocket();

      sockets.push(opened);

      return opened.socket;
    },
  );
};

const tick = (at: number) => {
  now = at;
  useDuelStore.getState().tick(at);
};

const char = (c: string): Key => ({ kind: "char", char: c });

// Presses the keys 100 ms apart from `from` on, the way the typing area does.
const pressFrom = (from: number, keys: Key[]) => {
  for (const [i, key] of keys.entries()) {
    now = from + i * 100;
    useDuelStore.getState().press(key, now);
  }
};

const type = (input: string, from = startsAt + 100) => pressFrom(from, [...input].map(char));

// The opponent's Keystrokes as the server relays them, stamped since the start of the Duel.
const opponentTyped = (input: string): Keystroke[] =>
  [...input].map((c, i) => ({ kind: "char", char: c, at: 100 + i * 100 }));

let stop = () => {};

// Every test starts on a first visit: default sound settings.
beforeEach(() => {
  useSoundStore.setState(useSoundStore.getInitialState());
});

afterEach(() => {
  stop();
  useDuelStore.getState().disconnect();
  vi.useRealTimers();
});

// Starts the sound, the way the app does at startup, and waits for the pack.
const listen = async () => {
  const fake = fakeOutput();

  stop = startSoundReactor(
    createAudioEngine(() => fake.output),
    { random: middle },
  );
  await decoded();

  return fake;
};

// Paired, then started: the Countdown is over.
const running = () => {
  connect();
  server().receive(duelFound);
  tick(startsAt);
};

describe("typing sound in a Duel", () => {
  test("the User's keys play the same sounds as in a solo Run", async () => {
    const { played } = await listen();

    running();
    type("small x");
    pressFrom(startsAt + 1_000, [{ kind: "backspace" }]);

    expect(played).toEqual([key07, key07, key07, key07, key07, space, key07, error, backspace]);
  });

  test("off silences the User's keys in a Duel too", async () => {
    const { played } = await listen();

    useSoundStore.getState().setPack("off");
    running();
    type("small x");

    expect(played).toEqual([]);
  });

  test("the opponent's Keystrokes play nothing", async () => {
    const { played } = await listen();

    running();
    server().receive({ type: "opponent-keystrokes", keystrokes: opponentTyped("small x") });

    expect(useDuelStore.getState().state).toMatchObject({
      phase: "running",
      duel: { opponentRun: { wordIndex: 1 } },
    });
    expect(played).toEqual([]);

    type("s");

    expect(played).toEqual([key07]);
  });

  test("a resync plays nothing", async () => {
    const { played } = await listen();

    running();
    type("sm");
    server().receive({
      type: "resync",
      keystrokes: [{ kind: "char", char: "s", at: 100 }],
      received: 2,
      opponentKeystrokes: opponentTyped("small"),
    });

    expect(played).toEqual([key07, key07]);
  });

  test("a reconnection plays nothing", async () => {
    const { played } = await listen();

    vi.useFakeTimers();
    running();
    type("sm");
    server().drop();
    vi.advanceTimersByTime(1_000);
    server().receive({
      type: "duel-resumed",
      duel,
      opponent,
      serverTime: now,
      keystrokes: [],
      received: 0,
      opponentKeystrokes: opponentTyped("small"),
      opponentConnected: true,
      pace: 40,
      opponentPace: 40,
    });

    expect(sockets).toHaveLength(2);
    expect(played).toEqual([key07, key07]);

    type("a", now + 100);

    expect(played).toEqual([key07, key07, key07]);
  });

  test("nothing plays during the Countdown", async () => {
    const { played } = await listen();

    connect();
    server().receive(duelFound);
    type("sm", 1_000);

    expect(useDuelStore.getState().state.phase).toBe("countdown");
    expect(played).toEqual([]);
  });

  test("nothing plays once the time is up, nor after the end of the Duel", async () => {
    const { played } = await listen();

    running();
    tick(endsAt);
    type("sm", endsAt + 100);

    expect(useDuelStore.getState().state.phase).toBe("finishing");

    server().receive({
      type: "duel-ended",
      outcome: "draw",
      forfeit: false,
      result: noResult,
      opponentResult: noResult,
      score: noScore,
      opponentScore: noScore,
      opponent,
    });
    type("sm", endsAt + 1_000);

    expect(useDuelStore.getState().state.phase).toBe("ended");
    expect(played).toEqual([]);
  });
});
