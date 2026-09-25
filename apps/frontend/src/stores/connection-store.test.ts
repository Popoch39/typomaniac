import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  challengesAfter,
  changesFriendLists,
  type LiveChallenges,
  type LiveFriends,
  friendsAfter,
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
  opponentRank: null,
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
  opponentRank: null,
};

const duelEnded: ServerMessage = {
  type: "duel-ended",
  duelId: "duel-1",
  ranked: null,
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

describe("the Friends, from the server's messages", () => {
  const known: LiveFriends = {
    presences: new Map([
      ["ada", "online"],
      ["alan", "offline"],
    ]),
    requestsReceived: 2,
  };

  test("are unknown until the snapshot, which sets them", () => {
    expect(friendsAfter(null, { type: "presence", userId: "ada", presence: "online" })).toBeNull();
    expect(
      friendsAfter(null, {
        type: "friends-snapshot",
        presences: [
          { userId: "ada", presence: "in-duel" },
          { userId: "alan", presence: "offline" },
        ],
        requestsReceived: 1,
      }),
    ).toEqual({
      presences: new Map([
        ["ada", "in-duel"],
        ["alan", "offline"],
      ]),
      requestsReceived: 1,
    });
  });

  test("a snapshot on a new socket replaces what was known", () => {
    expect(
      friendsAfter(known, { type: "friends-snapshot", presences: [], requestsReceived: 0 }),
    ).toEqual({ presences: new Map(), requestsReceived: 0 });
  });

  test("follow each Friend's Presence", () => {
    expect(
      friendsAfter(known, { type: "presence", userId: "alan", presence: "in-duel" })?.presences,
    ).toEqual(
      new Map([
        ["ada", "online"],
        ["alan", "in-duel"],
      ]),
    );
  });

  test("count the Friend requests received and gone, as the server does", () => {
    expect(
      friendsAfter(known, { type: "friend-request-received", userId: "bob", requestsReceived: 3 }),
    ).toEqual({ ...known, requestsReceived: 3 });
    expect(
      friendsAfter(known, { type: "friend-request-removed", userId: "bob", requestsReceived: 1 }),
    ).toEqual({ ...known, requestsReceived: 1 });
  });

  test("gain a new Friend with their Presence, and lose a Friend removed", () => {
    expect(
      friendsAfter(known, {
        type: "friend-added",
        userId: "bob",
        presence: "online",
        requestsReceived: 1,
      }),
    ).toEqual({
      presences: new Map([
        ["ada", "online"],
        ["alan", "offline"],
        ["bob", "online"],
      ]),
      requestsReceived: 1,
    });
    expect(friendsAfter(known, { type: "friend-removed", userId: "ada" })?.presences).toEqual(
      new Map([["alan", "offline"]]),
    );
  });

  test("unchanged by the Queue and the Duel", () => {
    expect(friendsAfter(known, { type: "queued" })).toBe(known);
    expect(friendsAfter(known, duelFound)).toBe(known);
  });

  test("the lists are read again when a request or a friendship changed, not on a Presence", () => {
    expect(
      changesFriendLists({ type: "friend-request-received", userId: "bob", requestsReceived: 1 }),
    ).toBe(true);
    expect(changesFriendLists({ type: "friend-removed", userId: "bob" })).toBe(true);
    expect(
      changesFriendLists({ type: "friends-snapshot", presences: [], requestsReceived: 0 }),
    ).toBe(true);
    expect(changesFriendLists({ type: "presence", userId: "bob", presence: "online" })).toBe(false);
    expect(changesFriendLists({ type: "idle" })).toBe(false);
  });
});

describe("the Challenges, from the server's messages", () => {
  const ada = { id: "ada", handle: "ada", image: null };
  const alan = { id: "alan", handle: "alan", image: null };

  // The server's clock runs 1 s ahead of this tab's, which reads 10_000.
  const NOW = 10_000;

  const known: LiveChallenges = {
    sent: { id: "c1", to: ada, expiresAt: 40_000 },
    received: [{ id: "c2", from: alan, expiresAt: 35_000 }],
  };

  test("are unknown until the snapshot, which sets them on this tab's clock", () => {
    expect(challengesAfter(null, { type: "idle" }, NOW)).toBeNull();
    expect(
      challengesAfter(
        null,
        {
          type: "challenges-snapshot",
          sent: { id: "c1", to: ada, expiresAt: 41_000 },
          received: [{ id: "c2", from: alan, expiresAt: 36_000 }],
          serverTime: 11_000,
        },
        NOW,
      ),
    ).toEqual(known);
  });

  test("gain a Challenge received, or the one sent", () => {
    const none: LiveChallenges = { sent: null, received: [] };

    expect(
      challengesAfter(
        none,
        {
          type: "challenge-received",
          challenge: { id: "c2", from: alan, expiresAt: 36_000 },
          serverTime: 11_000,
        },
        NOW,
      ),
    ).toEqual({ sent: null, received: known.received });
    expect(
      challengesAfter(
        none,
        {
          type: "challenge-sent",
          challenge: { id: "c1", to: ada, expiresAt: 41_000 },
          serverTime: 11_000,
        },
        NOW,
      ),
    ).toEqual({ sent: known.sent, received: [] });
  });

  test("lose a Challenge once it ended, sent or received", () => {
    expect(
      challengesAfter(
        known,
        { type: "challenge-ended", challengeId: "c1", reason: "declined" },
        NOW,
      ),
    ).toEqual({ sent: null, received: known.received });
    expect(
      challengesAfter(
        known,
        { type: "challenge-ended", challengeId: "c2", reason: "expired" },
        NOW,
      ),
    ).toEqual({ sent: known.sent, received: [] });
  });

  test("unchanged by a refusal, the Queue and the Duel", () => {
    expect(
      challengesAfter(known, { type: "challenge-refused", userId: "ada", reason: "offline" }, NOW),
    ).toBe(known);
    expect(challengesAfter(known, duelFound, NOW)).toBe(known);
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

  test("keeps the Friends the server tells, forgotten once the connection is lost", () => {
    useConnectionStore.getState().open(fake.open);
    fake.server().receive({ type: "idle" });
    fake.server().receive({
      type: "friends-snapshot",
      presences: [{ userId: "ada", presence: "online" }],
      requestsReceived: 1,
    });
    fake.server().receive({ type: "presence", userId: "ada", presence: "in-duel" });

    expect(useConnectionStore.getState().friends).toEqual({
      presences: new Map([["ada", "in-duel"]]),
      requestsReceived: 1,
    });

    fake.server().drop();
    expect(useConnectionStore.getState().friends).toBeNull();
  });

  test("keeps the Challenges the server tells, forgotten once the connection is lost", () => {
    useConnectionStore.getState().open(fake.open);
    fake.server().receive({ type: "idle" });
    fake.server().receive({ type: "challenges-snapshot", sent: null, received: [], serverTime: 0 });

    expect(useConnectionStore.getState().challenges).toEqual({ sent: null, received: [] });

    fake.server().drop();
    expect(useConnectionStore.getState().challenges).toBeNull();
  });

  test("opening it again closes the previous socket", () => {
    useConnectionStore.getState().open(fake.open);
    useConnectionStore.getState().open(fake.open);

    expect(fake.sockets.map((socket) => socket.isClosed())).toEqual([true, false]);
  });
});
