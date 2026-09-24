import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  onServerMessage,
  placeAfter,
  reconnectDelay,
  sendToServer,
  useConnectionStore,
} from "@/stores/connection-store";
import { fakeServer } from "@/test/fake-socket";

const duel = {
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  startsAt: 3_000,
} as const;

const opponent = { handle: "ada", image: null };

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

const duelFound: ServerMessage = {
  type: "duel-found",
  duel,
  opponent,
  serverTime: 0,
  pace: 40,
  opponentPace: 40,
};

const duelResumed: ServerMessage = {
  type: "duel-resumed",
  duel,
  opponent,
  serverTime: 0,
  keystrokes: [],
  received: 0,
  opponentKeystrokes: [],
  opponentConnected: true,
  pace: 40,
  opponentPace: 40,
};

const duelEnded: ServerMessage = {
  type: "duel-ended",
  outcome: "draw",
  forfeit: false,
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
  opponent,
};

describe("the User's place, from the server's messages", () => {
  test("is unknown until the server tells it", () => {
    expect(placeAfter(null, { type: "invalid-message" })).toBeNull();
  });

  test("idle, or held by another connection", () => {
    expect(placeAfter(null, { type: "idle" })).toEqual({ at: "idle" });
    expect(placeAfter(null, { type: "elsewhere", place: "queue" })).toEqual({
      at: "queue",
      here: false,
    });
    expect(placeAfter(null, { type: "elsewhere", place: "duel" })).toEqual({
      at: "duel",
      here: false,
    });
  });

  test("in the Queue or in a Duel played on this connection", () => {
    expect(placeAfter({ at: "idle" }, { type: "queued" })).toEqual({ at: "queue", here: true });
    expect(placeAfter({ at: "queue", here: true }, duelFound)).toEqual({ at: "duel", here: true });
    expect(placeAfter({ at: "duel", here: false }, duelResumed)).toEqual({
      at: "duel",
      here: true,
    });
  });

  test("idle again once the Duel is over", () => {
    expect(placeAfter({ at: "duel", here: true }, duelEnded)).toEqual({ at: "idle" });
  });

  test("unchanged by the messages of a Duel in play or a refusal", () => {
    const place = { at: "duel", here: true } as const;

    expect(placeAfter(place, { type: "opponent-disconnected" })).toBe(place);
    expect(placeAfter(place, { type: "opponent-keystrokes", keystrokes: [] })).toBe(place);
    expect(placeAfter({ at: "idle" }, { type: "handle-required" })).toEqual({ at: "idle" });
  });
});

describe("the delay before opening a lost connection again", () => {
  test("doubles from a second, up to 8 s", () => {
    expect([0, 1, 2, 3, 4, 10].map(reconnectDelay)).toEqual([
      1_000, 2_000, 4_000, 8_000, 8_000, 8_000,
    ]);
  });
});

describe("the connection store", () => {
  let fake: ReturnType<typeof fakeServer>;

  beforeEach(() => {
    vi.useFakeTimers();
    fake = fakeServer();
  });

  afterEach(() => {
    useConnectionStore.getState().close();
    vi.useRealTimers();
  });

  test("is open once the server tells the place, which it keeps up to date", () => {
    useConnectionStore.getState().open(fake.open);

    expect(useConnectionStore.getState()).toMatchObject({ status: "connecting", place: null });

    fake.server().receive({ type: "idle" });
    expect(useConnectionStore.getState()).toMatchObject({
      status: "open",
      place: { at: "idle" },
    });

    fake.server().receive({ type: "elsewhere", place: "queue" });
    expect(useConnectionStore.getState().place).toEqual({ at: "queue", here: false });
  });

  test("hands every server message on and sends on the open socket", () => {
    const received: ServerMessage[] = [];
    const stop = onServerMessage((message) => received.push(message));

    useConnectionStore.getState().open(fake.open);
    fake.server().receive({ type: "idle" });
    sendToServer({ type: "join-queue" });
    stop();
    fake.server().receive({ type: "queued" });

    expect(received).toEqual([{ type: "idle" }]);
    expect(fake.server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("opens a lost connection again, sooner once it was back", () => {
    useConnectionStore.getState().open(fake.open);
    fake.server().receive({ type: "idle" });
    fake.server().drop();

    expect(useConnectionStore.getState()).toMatchObject({ status: "connecting", place: null });

    vi.advanceTimersByTime(999);
    expect(fake.sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(fake.sockets).toHaveLength(2);

    // Lost again before the server answered: longer.
    fake.server().drop();
    vi.advanceTimersByTime(1_999);
    expect(fake.sockets).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(fake.sockets).toHaveLength(3);

    // Back: a later loss starts from a second again.
    fake.server().receive({ type: "idle" });
    fake.server().drop();
    vi.advanceTimersByTime(1_000);
    expect(fake.sockets).toHaveLength(4);
  });

  test("closing it on purpose opens nothing again, and ignores the old socket", () => {
    const received: ServerMessage[] = [];
    const stop = onServerMessage((message) => received.push(message));

    useConnectionStore.getState().open(fake.open);

    const [first] = fake.sockets;

    useConnectionStore.getState().close();

    expect(first?.isClosed()).toBe(true);
    expect(useConnectionStore.getState()).toMatchObject({ status: "closed", place: null });

    first?.receive({ type: "idle" });
    first?.drop();
    vi.advanceTimersByTime(60_000);
    stop();

    expect(fake.sockets).toHaveLength(1);
    expect(received).toEqual([]);
  });

  test("opening it again closes the previous socket", () => {
    useConnectionStore.getState().open(fake.open);
    useConnectionStore.getState().open(fake.open);

    expect(fake.sockets.map((socket) => socket.isClosed())).toEqual([true, false]);
  });
});
