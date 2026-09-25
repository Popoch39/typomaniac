import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import pino from "pino";
import { PLACEMENT_DUELS, type Rating, seedMmr } from "ranked";
import {
  computeResult,
  computeScore,
  currentWordListVersion,
  defaultPace,
  generateText,
} from "typing-engine";

import { createApp } from "../../app";
import {
  createTestAuth,
  manualClock,
  memoryDuelStore,
  openClient,
  pastDuel,
  signIn,
  type TestAuth,
  type TestClient,
  testConfig,
} from "../../test-app";
import { MAX_DUEL_MESSAGE_SIZE, type ServerMessage } from "./model";
import { END_TOLERANCE_MS } from "./running-duel";
import { SAVE_TIMEOUT_MS } from "./service";
import type { DuelRecord } from "./store";

const NOW = 1_700_000_000_000;

// A Duel paired at NOW starts after the 3 s Countdown and lasts 30 s.
const STARTS_AT = NOW + 3000;

// Its time is up: the end written for a Duel that was not forfeited.
const TIME_UP = STARTS_AT + 30_000;

// The server ends it once the last Keystrokes had the time to arrive.
const ENDS_AT = TIME_UP + END_TOLERANCE_MS;

const char = (value: string, at: number) => ({ kind: "char" as const, char: value, at });

const duelOf = (message: ServerMessage) =>
  message.type === "duel-found" || message.type === "duel-resumed" ? message.duel : null;

// The end of their Duel as a player is told it.
const endedOf = (message: ServerMessage) => {
  if (message.type !== "duel-ended") {
    throw new Error(`Not the end of a Duel: ${message.type}`);
  }

  return message;
};

const resultOf = (message: ServerMessage) => endedOf(message).result;

const scoreOf = (message: ServerMessage) => endedOf(message).score;

// The first `count` words of the Duel's Text.
const wordsOf = (message: ServerMessage, count: number) => {
  const duel = duelOf(message);

  return duel === null ? [] : generateText(duel.seed, "en", duel.wordListVersion, count);
};

// The first word of the Duel's Text: typed right with its space, it is worth (length + 1) chars
// in 30 s, so (length + 1) / 5 / 0.5 wpm.
const firstWordOf = (message: ServerMessage) => wordsOf(message, 1)[0] ?? "";

// A word and its space, one Keystroke every `every` ms from `start`.
const typed = (word: string, start: number, every = 100) =>
  [...`${word} `].map((value, i) => char(value, start + i * every));

// Words typed right one after the other, one Keystroke every `every` ms from `start`.
const typedWords = (words: readonly string[], start: number, every: number) =>
  typed(words.join(" "), start, every);

// Words each typed with a mistake first, erased, then right: one Keystroke every `every` ms. No
// word goes into a Combo, each is paid x1.
const sloppyWords = (words: readonly string[], start: number, every: number) =>
  words
    .flatMap((word) => ["#", "backspace", ...`${word} `])
    .map((key, i) =>
      key === "backspace"
        ? { kind: "backspace" as const, at: start + i * every }
        : char(key, start + i * every),
    );

// `count` Keystrokes, one every `every` ms from `start`: the letters of the alphabet in turn.
const burst = (count: number, start: number, every: number) =>
  Array.from({ length: count }, (_, i) =>
    char(String.fromCodePoint(97 + (i % 26)), start + i * every),
  );

// Each test User's Handle is their name, lowercased (signedInUser).
const duelFound = (opponent: string) => ({
  type: "duel-found" as const,
  duel: expect.any(Object),
  opponent: { handle: opponent.toLowerCase(), image: `https://img/${opponent.toLowerCase()}` },
  serverTime: NOW,
  // Neither User has played a Duel yet.
  pace: defaultPace,
  opponentPace: defaultPace,
});

// Or IV expects an MMR of 1000, Diamant IV one of 1400: at those, no catch-up moves the TP.
const orIv = (tp: number) => ({ tier: "or" as const, division: 4 as const, tp, shielded: false });

const diamantIv = (tp: number) => ({
  tier: "diamant" as const,
  division: 4 as const,
  tp,
  shielded: false,
});

// Ada's connection drops: Alan is told.
const dropped = async (ada: TestClient, alan: TestClient) => {
  ada.socket.close();
  await ada.closed;
  expect(await alan.next()).toEqual({ type: "opponent-disconnected" });
};

describe("duel socket", () => {
  let auth: TestAuth;
  let app: ReturnType<typeof createApp>;
  let url: string;
  const clients: TestClient[] = [];

  // The server's time, moved by hand.
  let setNow: (time: number) => void;

  // The finished Duels written by the server.
  let saved: DuelRecord[];

  // Each User's Rating, as the server writes it.
  let ratings: Map<string, Rating>;

  beforeEach(() => {
    const { clock, set } = manualClock(NOW);
    const duels = memoryDuelStore();

    setNow = set;
    saved = duels.saved;
    ratings = duels.ratings;
    auth = createTestAuth();
    app = createApp(testConfig({ auth, clock, duelStore: duels.store })).listen(0);
    url = `ws://localhost:${app.server?.port}/api/duel`;
  });

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.socket.close();
    }

    await app.stop(true);
  });

  const connect = async (cookie?: string) => {
    const client = openClient(url, cookie);

    clients.push(client);
    await client.opened;

    return client;
  };

  let users = 0;

  // A new User, with the cookie of their Session: their Handle is their name lowercased, unless
  // they have none yet.
  const signedInUser = async (name: string, { withHandle = true } = {}) => {
    users += 1;

    const { user, cookie } = await signIn(auth, {
      name,
      email: `${name.toLowerCase()}-${users}@example.com`,
      image: `https://img/${name.toLowerCase()}`,
      handle: withHandle ? name.toLowerCase() : undefined,
    });

    return { id: user.id, cookie };
  };

  const signedIn = async (name: string) => (await signedInUser(name)).cookie;

  const queued = async (cookie: string) => {
    const client = await connect(cookie);

    expect(await client.next()).toEqual({ type: "idle" });
    client.send({ type: "join-queue" });
    expect(await client.next()).toEqual({ type: "queued" });

    return client;
  };

  // Queued 30 s before NOW: whoever joins at NOW is paired with them, whatever their MMRs.
  const queuedLongAgo = async (cookie: string) => {
    setNow(NOW - 30_000);

    const client = await queued(cookie);

    await client.settle();
    setNow(NOW);

    return client;
  };

  test("refuses the upgrade without a valid Session", async () => {
    const client = openClient(url);

    expect(await client.opened).toBe(false);

    const response = await fetch(`http://localhost:${app.server?.port}/api/duel`, {
      headers: {
        connection: "Upgrade",
        upgrade: "websocket",
        "sec-websocket-version": "13",
        "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==",
      },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  test("refuses the upgrade with an unknown Session cookie", async () => {
    const client = openClient(url, "better-auth.session_token=forged.token");

    expect(await client.opened).toBe(false);
  });

  test("pairs two queued Users into the same Duel, each facing the other", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    expect(forAlan).toEqual({
      type: "duel-found",
      duel: {
        id: expect.any(String),
        seed: expect.any(Number),
        language: "en",
        wordListVersion: currentWordListVersion.en,
        seconds: 30,
        startsAt: STARTS_AT,
      },
      opponent: { handle: "ada", image: "https://img/ada" },
      serverTime: NOW,
      pace: defaultPace,
      opponentPace: defaultPace,
    });
    expect(forAda).toEqual(duelFound("Alan"));
    // The very same Duel (id, Seed, start), only the opponent differs.
    expect(duelOf(forAda)).toEqual(duelOf(forAlan));
  });

  test("a User without a Handle cannot join the Queue, and is told why", async () => {
    const nobody = await connect((await signedInUser("Nobody", { withHandle: false })).cookie);

    expect(await nobody.next()).toEqual({ type: "idle" });
    nobody.send({ type: "join-queue" });
    expect(await nobody.next()).toEqual({ type: "handle-required" });

    // Not in the Queue: the next User waits alone.
    const ada = await queued(await signedIn("Ada"));

    await ada.settle();
    await nobody.settle();
  });

  test("the opponent is shown by their Handle of the moment, never by their name", async () => {
    const adaUser = await signedInUser("Ada");
    const ada = await connect(adaUser.cookie);

    expect(await ada.next()).toEqual({ type: "idle" });

    // Changed after the socket opened, with the Session's cached User still holding the old one.
    const context = await auth.$context;

    await context.internalAdapter.updateUser(adaUser.id, { handle: "countess" });
    ada.send({ type: "join-queue" });
    expect(await ada.next()).toEqual({ type: "queued" });

    const alan = await queued(await signedIn("Alan"));

    expect(await alan.next()).toMatchObject({
      type: "duel-found",
      opponent: { handle: "countess", image: "https://img/ada" },
    });
    expect(await ada.next()).not.toHaveProperty("opponent.name");
  });

  test("each User's Pace is the median wpm of their last 10 Duels, sent to both players", async () => {
    const adaUser = await signedInUser("Ada");
    const alanUser = await signedInUser("Alan");

    // Written in no particular order: the 10 most recent count, the 5 older ones do not.
    const recent = [60, 90, 72, 65, 88, 70, 74, 61, 80, 77].map((wpm, i) =>
      pastDuel(adaUser.id, wpm, NOW - 1000 * (i + 1)),
    );

    const older = [200, 200, 200, 200, 200].map((wpm, i) =>
      pastDuel(adaUser.id, wpm, NOW - 100_000 * (i + 1)),
    );

    saved.push(...older.slice(0, 2), ...recent, ...older.slice(2));

    // Her Pace seeds an MMR far from Alan's: she waited long enough for any.
    const ada = await queuedLongAgo(adaUser.cookie);
    const alan = await queued(alanUser.cookie);

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    // Sorted: 60 61 65 70 72 74 77 80 88 90.
    expect(forAda).toMatchObject({ type: "duel-found", pace: 73, opponentPace: defaultPace });
    expect(forAlan).toMatchObject({ type: "duel-found", pace: defaultPace, opponentPace: 73 });
  });

  test("a User's Pace counts the Duel they just finished", async () => {
    const adaUser = await signedInUser("Ada");
    const alanUser = await signedInUser("Alan");
    const ada = await queued(adaUser.cookie);
    const alan = await queued(alanUser.cookie);
    const [found] = await Promise.all([ada.next(), alan.next()]);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(firstWordOf(found), 1000) });
    await alan.next();
    setNow(ENDS_AT);

    const [ending] = await Promise.all([ada.next().then(endedOf), alan.next()]);

    ada.send({ type: "join-queue" });
    alan.send({ type: "join-queue" });
    expect(await ada.next()).toEqual({ type: "queued" });
    expect(await alan.next()).toEqual({ type: "queued" });

    expect(await ada.next()).toMatchObject({
      type: "duel-found",
      pace: ending.result.wpm,
      opponentPace: ending.opponentResult.wpm,
    });
  });

  test("never pairs a User alone in the Queue", async () => {
    const ada = await queued(await signedIn("Ada"));

    await ada.settle();
  });

  test("leaving the Queue takes the User out of it", async () => {
    const ada = await queued(await signedIn("Ada"));

    ada.send({ type: "leave-queue" });

    const alan = await queued(await signedIn("Alan"));

    await ada.settle();
    await alan.settle();
  });

  test("closing the socket takes the User out of the Queue", async () => {
    const ada = await queued(await signedIn("Ada"));

    ada.socket.close();
    await ada.closed;

    const alan = await queued(await signedIn("Alan"));

    await alan.settle();
  });

  test("two tabs of the same User stay open, only the one that joined the Queue plays", async () => {
    const cookie = await signedIn("Ada");
    const firstTab = await queued(cookie);
    const secondTab = await connect(cookie);

    expect(await secondTab.next()).toEqual({ type: "elsewhere", place: "queue" });
    await firstTab.settle();

    // Leaving from the tab that does not play: ignored, she is still in the Queue.
    secondTab.send({ type: "leave-queue" });
    await secondTab.settle();

    const alan = await queued(await signedIn("Alan"));

    expect(await firstTab.next()).toEqual(duelFound("Alan"));
    expect(await secondTab.next()).toEqual({ type: "elsewhere", place: "duel" });
    expect(await alan.next()).toEqual(duelFound("Ada"));

    // Its Keystrokes and its Forfeit are ignored too.
    setNow(STARTS_AT + 1000);
    secondTab.send({ type: "keystrokes", keystrokes: [char("s", 100)] });
    secondTab.send({ type: "leave-duel" });
    await secondTab.settle();
    await alan.settle();

    firstTab.send({ type: "keystrokes", keystrokes: [char("s", 100)] });
    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });
  });

  test("joining the Queue from another tab plays it there, still one place", async () => {
    const cookie = await signedIn("Ada");
    const firstTab = await queued(cookie);
    const secondTab = await connect(cookie);

    expect(await secondTab.next()).toEqual({ type: "elsewhere", place: "queue" });
    secondTab.send({ type: "join-queue" });
    expect(await secondTab.next()).toEqual({ type: "queued" });
    expect(await firstTab.next()).toEqual({ type: "elsewhere", place: "queue" });

    // Never paired against herself.
    await secondTab.settle();

    const alan = await queued(await signedIn("Alan"));

    expect(await secondTab.next()).toEqual(duelFound("Alan"));
    expect(await firstTab.next()).toEqual({ type: "elsewhere", place: "duel" });
    expect(await alan.next()).toEqual(duelFound("Ada"));
  });

  test("every tab is told the User's place when it changes", async () => {
    const cookie = await signedIn("Ada");
    const watching = await connect(cookie);

    expect(await watching.next()).toEqual({ type: "idle" });

    const playing = await queued(cookie);

    expect(await watching.next()).toEqual({ type: "elsewhere", place: "queue" });

    playing.send({ type: "leave-queue" });
    expect(await watching.next()).toEqual({ type: "idle" });

    playing.send({ type: "join-queue" });
    expect(await playing.next()).toEqual({ type: "queued" });
    expect(await watching.next()).toEqual({ type: "elsewhere", place: "queue" });

    const alan = await queued(await signedIn("Alan"));

    expect(await playing.next()).toMatchObject({ type: "duel-found" });
    expect(await watching.next()).toEqual({ type: "elsewhere", place: "duel" });
    await alan.next();

    setNow(ENDS_AT);
    expect(await playing.next()).toMatchObject({ type: "duel-ended" });
    expect(await watching.next()).toEqual({ type: "idle" });

    // Closing the tab that played while in the Queue: the others see her leave it.
    playing.send({ type: "join-queue" });
    expect(await playing.next()).toEqual({ type: "queued" });
    expect(await watching.next()).toEqual({ type: "elsewhere", place: "queue" });
    playing.socket.close();
    expect(await watching.next()).toEqual({ type: "idle" });
  });

  test("tells a User with no place that they are idle on connection", async () => {
    const ada = await connect(await signedIn("Ada"));

    expect(await ada.next()).toEqual({ type: "idle" });
    await ada.settle();
  });

  test("rejects a malformed message and keeps the connection", async () => {
    const ada = await connect(await signedIn("Ada"));

    expect(await ada.next()).toEqual({ type: "idle" });

    ada.socket.send(JSON.stringify({ type: "join-duel-now" }));
    expect(await ada.next()).toEqual({ type: "invalid-message" });

    ada.send({ type: "join-queue" });
    expect(await ada.next()).toEqual({ type: "queued" });
  });

  test("closes the connection on a message over the size limit", async () => {
    const ada = await connect(await signedIn("Ada"));

    ada.socket.send("x".repeat(MAX_DUEL_MESSAGE_SIZE + 1));

    expect(await ada.closed).not.toBe(1000);
  });

  // Ada and Alan paired at NOW, the Duel found read: their User ids, and the cookie Ada signed in
  // with, to reconnect. Ada has finished a Duel at each of `adaWpms` before, the most recent first.
  const pairedUsers = async ({ adaWpms = [] }: { adaWpms?: readonly number[] } = {}) => {
    const adaUser = await signedInUser("Ada");
    const alanUser = await signedInUser("Alan");

    saved.push(...adaWpms.map((wpm, i) => pastDuel(adaUser.id, wpm, NOW - 1000 * (i + 1))));

    const ada = await queuedLongAgo(adaUser.cookie);
    const alan = await queued(alanUser.cookie);
    const [found] = await Promise.all([ada.next(), alan.next()]);

    return { ada, alan, adaId: adaUser.id, alanId: alanUser.id, cookie: adaUser.cookie, found };
  };

  // Ada and Alan, paired at NOW, each Duel found read.
  const paired = async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));

    const [found] = await Promise.all([ada.next(), alan.next()]);

    return { ada, alan, found };
  };

  test("relays the accepted Keystrokes to the opponent, not back to the sender", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 300);
    ada.send({ type: "keystrokes", keystrokes: [char("s", 100), char("m", 250)] });

    expect(await alan.next()).toEqual({
      type: "opponent-keystrokes",
      keystrokes: [char("s", 100), char("m", 250)],
    });
    await ada.settle();
  });

  test("a Keystroke dated after its arrival is ignored, and its sender resynced", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 1000);
    alan.send({ type: "keystrokes", keystrokes: [char("h", 400)] });
    expect(await ada.next()).toMatchObject({ type: "opponent-keystrokes" });

    // "m" is dated 1 s in the future: rejected, the Keystrokes around it still count.
    ada.send({ type: "keystrokes", keystrokes: [char("s", 100), char("m", 2000), char("a", 300)] });

    expect(await alan.next()).toEqual({
      type: "opponent-keystrokes",
      keystrokes: [char("s", 100), char("a", 300)],
    });
    expect(await ada.next()).toEqual({
      type: "resync",
      keystrokes: [char("s", 100), char("a", 300)],
      received: 3,
      opponentKeystrokes: [char("h", 400)],
    });
  });

  test("a Keystroke sent during the Countdown is ignored", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT - 500);
    ada.send({ type: "keystrokes", keystrokes: [char("s", -600)] });

    expect(await ada.next()).toEqual({
      type: "resync",
      keystrokes: [],
      received: 1,
      opponentKeystrokes: [],
    });
    await alan.settle();
  });

  test("a Keystroke dated before the previous one is ignored", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 1000);
    ada.send({ type: "keystrokes", keystrokes: [char("s", 500)] });
    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });

    ada.send({ type: "keystrokes", keystrokes: [char("m", 400)] });

    expect(await ada.next()).toMatchObject({ type: "resync", received: 2 });
    await alan.settle();
  });

  test("a Keystroke arriving within the tolerance after the end still counts", async () => {
    const { ada, alan } = await paired();

    setNow(ENDS_AT - 1);
    ada.send({ type: "keystrokes", keystrokes: [char("s", 29_900)] });

    expect(await alan.next()).toEqual({
      type: "opponent-keystrokes",
      keystrokes: [char("s", 29_900)],
    });
    await ada.settle();
  });

  test("the Duel ends for both at the end plus the tolerance, and Keystrokes past it are ignored", async () => {
    const { ada, alan } = await paired();

    setNow(ENDS_AT - 1);
    await ada.settle();
    await alan.settle();

    setNow(ENDS_AT);

    expect(await ada.next()).toMatchObject({ type: "duel-ended" });
    expect(await alan.next()).toMatchObject({ type: "duel-ended" });

    ada.send({ type: "keystrokes", keystrokes: [char("s", 29_950)] });

    await ada.settle();
    await alan.settle();
  });

  test("the best Score wins, and both see the same Results and Scores", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    // Slower than the Pace: no Burst.
    ada.send({ type: "keystrokes", keystrokes: typed(word, 2000, 250) });
    await alan.next();

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    expect(forAda).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      forfeit: false,
      result: { wpm: (word.length + 1) / 5 / 0.5, accuracy: 100 },
      opponentResult: { wpm: 0, accuracy: 0 },
      score: { score: word.length + 1, bestCombo: 1, bursts: 0 },
      opponentScore: { score: 0, bestCombo: 0, bursts: 0 },
      opponent: { handle: "alan", image: "https://img/alan" },
    });
    expect(forAlan).toMatchObject({
      type: "duel-ended",
      outcome: "loss",
      forfeit: false,
      opponent: { handle: "ada" },
    });

    const ended = [forAda, forAlan].map((message) =>
      message.type === "duel-ended" ? message : null,
    );

    expect(ended[0]?.result).toEqual(ended[1]?.opponentResult);
    expect(ended[0]?.opponentResult).toEqual(ended[1]?.result);
    expect(ended[0]?.score).toEqual(ended[1]?.opponentScore);
    expect(ended[0]?.opponentScore).toEqual(ended[1]?.score);
  });

  test("a slower player who keeps their Combo beats a faster one who makes mistakes", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);
    const words = wordsOf(found, 11);

    setNow(STARTS_AT + 29_000);
    // Ada: 10 words without a mistake, the 5th to the 9th paid x2 and the 10th x3.
    ada.send({ type: "keystrokes", keystrokes: typedWords(words.slice(0, 10), 2000, 250) });
    await alan.next();

    // Alan: one more word, but each corrected, all paid x1. Two batches: too many for one.
    const sloppy = sloppyWords(words, 1000, 60);

    alan.send({ type: "keystrokes", keystrokes: sloppy.slice(0, 60) });
    alan.send({ type: "keystrokes", keystrokes: sloppy.slice(60) });
    await ada.next();
    await ada.next();

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next().then(endedOf), alan.next()]);

    expect(forAda.opponentResult.wpm).toBeGreaterThan(forAda.result.wpm);
    expect(forAda).toMatchObject({
      outcome: "win",
      score: { bestCombo: 10, bursts: 0 },
      // A corrected word starts the Combo again at 1.
      opponentScore: { bestCombo: 1, bursts: 0 },
    });
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "loss" });
  });

  test("the same Score is won by the best accuracy", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    // The same word at the same time, then a mistake that scores nothing.
    alan.send({ type: "keystrokes", keystrokes: [...typed(word, 1000), char("#", 3000)] });
    await Promise.all([ada.next(), alan.next()]);

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next().then(endedOf), alan.next()]);

    expect(forAda.score.score).toBe(forAda.opponentScore.score);
    expect(forAda.result.accuracy).toBeGreaterThan(forAda.opponentResult.accuracy);
    expect(forAda.outcome).toBe("win");
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "loss" });
  });

  test("the same Score and accuracy is a Draw for both", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    alan.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    await Promise.all([ada.next(), alan.next()]);

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    expect(forAda).toMatchObject({ type: "duel-ended", outcome: "draw" });
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "draw" });
  });

  test("a Burst is judged against the player's own Pace", async () => {
    // Ada's Pace is 500 wpm: a Burst takes her 600 wpm. Alan's is 50: 60 wpm is enough.
    const { ada, alan, found } = await pairedUsers({ adaWpms: [500] });
    const duel = duelOf(found);
    // Both type the same words the same way, at 480 wpm.
    const keystrokes = typedWords(wordsOf(found, 10), 100, 25);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes });
    alan.send({ type: "keystrokes", keystrokes });
    await Promise.all([ada.next(), alan.next()]);

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next().then(endedOf), alan.next()]);

    if (duel === null) {
      throw new Error(`No Duel found: ${found.type}`);
    }

    const config = { mode: "time" as const, ...duel };

    const scored = (pace: number) => {
      const { score, bestCombo, bursts } = computeScore(config, keystrokes, pace, 30_000);

      return { score, bestCombo, bursts };
    };

    expect(forAda.score).toEqual(scored(500));
    expect(forAda.opponentScore).toEqual(scored(defaultPace));
    expect(forAda.score.bursts).toBe(0);
    expect(forAda.opponentScore.bursts).toBeGreaterThan(0);
    expect(forAda.outcome).toBe("loss");
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "win" });
  });

  test("ignores Keystrokes from a User who is not in a Duel", async () => {
    const ada = await queued(await signedIn("Ada"));

    ada.send({ type: "keystrokes", keystrokes: [char("s", 100)] });

    await ada.settle();
  });

  test("a User in a Duel cannot join the Queue until the Duel is over", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 10_000);
    ada.send({ type: "join-queue" });
    await ada.settle();

    // The time is up, but the Duel waits for the last Keystrokes.
    setNow(ENDS_AT - 1);
    ada.send({ type: "join-queue" });
    await ada.settle();

    setNow(ENDS_AT);
    expect(await ada.next()).toMatchObject({ type: "duel-ended" });
    expect(await alan.next()).toMatchObject({ type: "duel-ended" });

    // A new Duel.
    ada.send({ type: "join-queue" });
    expect(await ada.next()).toEqual({ type: "queued" });

    alan.send({ type: "join-queue" });
    expect(await alan.next()).toEqual({ type: "queued" });
    expect(await ada.next()).toMatchObject({ type: "duel-found", opponent: { handle: "alan" } });
  });

  // A new socket of the User, as after a reload: told she is in a Duel, she plays it there.
  const resumedOn = async (cookie: string) => {
    const client = await connect(cookie);

    expect(await client.next()).toEqual({ type: "elsewhere", place: "duel" });
    client.send({ type: "resume-duel" });

    return client;
  };

  test("leaving the Duel is an immediate Forfeit, the opponent wins", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 5000);
    ada.send({ type: "leave-duel" });

    expect(await ada.next()).toMatchObject({
      type: "duel-ended",
      outcome: "loss",
      forfeit: true,
      opponent: { handle: "alan" },
    });
    expect(await alan.next()).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      forfeit: true,
      opponent: { handle: "ada" },
    });

    // Over for both: the scheduled end does not end it again.
    setNow(ENDS_AT);
    await ada.settle();
    await alan.settle();
  });

  test("a Forfeit decides the Duel, whatever the Scores", async () => {
    const { ada, alan, found } = await paired();

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(firstWordOf(found), 1000) });
    await alan.next();
    ada.send({ type: "leave-duel" });

    const [forAda, forAlan] = await Promise.all([ada.next().then(endedOf), alan.next()]);

    expect(forAda.score.score).toBeGreaterThan(forAda.opponentScore.score);
    expect(forAda).toMatchObject({ outcome: "loss", forfeit: true });
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "win", forfeit: true });
  });

  test("leaving the Duel during the Countdown is a Forfeit too", async () => {
    const { ada, alan } = await paired();

    alan.send({ type: "leave-duel" });

    expect(await alan.next()).toMatchObject({ type: "duel-ended", outcome: "loss", forfeit: true });
    expect(await ada.next()).toMatchObject({ type: "duel-ended", outcome: "win", forfeit: true });
  });

  test("leaving a Duel is ignored outside one", async () => {
    const ada = await queued(await signedIn("Ada"));

    ada.send({ type: "leave-duel" });
    await ada.settle();
  });

  test("a disconnected player back within 10 s resumes the Duel where it was", async () => {
    const { cookie, ada, alan, adaId, found } = await pairedUsers({ adaWpms: [64, 80] });

    // Written during the Duel: its Pace does not move.
    saved.push(pastDuel(adaId, 300, STARTS_AT));

    setNow(STARTS_AT + 1000);
    ada.send({ type: "keystrokes", keystrokes: [char("s", 100), char("m", 2000)] });
    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });
    expect(await ada.next()).toMatchObject({ type: "resync" });
    alan.send({ type: "keystrokes", keystrokes: [char("h", 400)] });
    expect(await ada.next()).toMatchObject({ type: "opponent-keystrokes" });

    await dropped(ada, alan);

    setNow(STARTS_AT + 1000 + 9999);
    await alan.settle();

    const back = await resumedOn(cookie);

    const resumed = await back.next();

    // The very Duel that was found.
    expect(duelOf(resumed)).toEqual(duelOf(found));
    expect(resumed).toEqual({
      type: "duel-resumed",
      duel: expect.any(Object),
      opponent: { handle: "alan", image: "https://img/alan" },
      serverTime: STARTS_AT + 1000 + 9999,
      keystrokes: [char("s", 100)],
      received: 2,
      opponentKeystrokes: [char("h", 400)],
      opponentConnected: true,
      // Frozen at the pairing.
      pace: 72,
      opponentPace: defaultPace,
    });
    expect(await alan.next()).toEqual({ type: "opponent-reconnected" });

    // Past the 10 s: no Forfeit, the Duel goes on.
    setNow(STARTS_AT + 20_000);
    back.send({ type: "keystrokes", keystrokes: [char("a", 15_000)] });
    expect(await alan.next()).toEqual({
      type: "opponent-keystrokes",
      keystrokes: [char("a", 15_000)],
    });

    setNow(ENDS_AT);
    expect(await back.next()).toMatchObject({ type: "duel-ended", forfeit: false });
    expect(await alan.next()).toMatchObject({ type: "duel-ended", forfeit: false });
  });

  test("a disconnected player not back within 10 s forfeits, and learns it on their return", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);

    setNow(STARTS_AT + 11_000);
    expect(await alan.next()).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      forfeit: true,
      opponent: { handle: "ada" },
    });

    const back = await resumedOn(cookie);

    expect(await back.next()).toMatchObject({
      type: "duel-ended",
      outcome: "loss",
      forfeit: true,
      opponent: { handle: "alan" },
    });

    // Told once: free for a new Duel.
    const other = await connect(cookie);

    expect(await other.next()).toEqual({ type: "idle" });
    back.send({ type: "join-queue" });
    expect(await back.next()).toEqual({ type: "queued" });
  });

  test("a missed end goes to the tab that resumes the Duel, not to any tab opened first", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);
    setNow(STARTS_AT + 11_000);
    await alan.next();

    // A tab opened elsewhere in the app: not told the end, the Duel still waits for her.
    const elsewhere = await connect(cookie);

    expect(await elsewhere.next()).toEqual({ type: "elsewhere", place: "duel" });

    const back = await resumedOn(cookie);

    expect(await back.next()).toMatchObject({ type: "duel-ended", outcome: "loss" });
    expect(await elsewhere.next()).toEqual({ type: "idle" });
  });

  test("joining the Queue drops a missed end", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);
    setNow(STARTS_AT + 11_000);
    await alan.next();

    const back = await connect(cookie);

    expect(await back.next()).toEqual({ type: "elsewhere", place: "duel" });
    back.send({ type: "join-queue" });
    expect(await back.next()).toEqual({ type: "queued" });

    const later = await connect(cookie);

    expect(await later.next()).toEqual({ type: "elsewhere", place: "queue" });
  });

  test("a second disconnection gets its own 10 s", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);

    setNow(STARTS_AT + 5000);

    const back = await resumedOn(cookie);

    expect(await back.next()).toMatchObject({ type: "duel-resumed" });
    expect(await alan.next()).toEqual({ type: "opponent-reconnected" });

    setNow(STARTS_AT + 8000);
    await dropped(back, alan);

    // The first disconnection's 10 s are over, not the second's.
    setNow(STARTS_AT + 17_999);
    await alan.settle();

    setNow(STARTS_AT + 18_000);
    expect(await alan.next()).toMatchObject({ type: "duel-ended", outcome: "win", forfeit: true });
  });

  test("the opponent resuming while the other is away sees them disconnected", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(STARTS_AT + 1000);
    await dropped(alan, ada);
    ada.socket.close();
    await ada.closed;

    const back = await resumedOn(cookie);

    expect(await back.next()).toMatchObject({ type: "duel-resumed", opponentConnected: false });
  });

  test("a Duel whose end came while a player was away tells them on their return", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(ENDS_AT - 5000);
    await dropped(ada, alan);

    setNow(ENDS_AT);
    expect(await alan.next()).toMatchObject({ type: "duel-ended", forfeit: false });

    // The 10 s run out after the end: nothing more.
    setNow(ENDS_AT + 10_000);
    await alan.settle();

    const back = await resumedOn(cookie);

    expect(await back.next()).toMatchObject({ type: "duel-ended", forfeit: false });
    await back.settle();
  });

  test("another tab resumes the Duel there, the first one is told, the opponent is not", async () => {
    const { cookie, ada, alan } = await pairedUsers();

    setNow(STARTS_AT + 1000);

    const secondTab = await resumedOn(cookie);

    expect(await secondTab.next()).toMatchObject({
      type: "duel-resumed",
      opponent: { handle: "alan" },
      opponentConnected: true,
    });
    expect(await ada.next()).toEqual({ type: "elsewhere", place: "duel" });
    await alan.settle();

    // Only the second tab plays now.
    ada.send({ type: "keystrokes", keystrokes: [char("s", 100)] });
    await ada.settle();
    await alan.settle();
    secondTab.send({ type: "keystrokes", keystrokes: [char("s", 100)] });
    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });

    // Closing the first tab is not a disconnection: no Forfeit.
    ada.socket.close();
    await ada.closed;
    setNow(STARTS_AT + 20_000);
    await alan.settle();
  });

  test("the time to come back runs once no tab plays, even with another one open", async () => {
    const { cookie, ada, alan } = await pairedUsers();
    const watching = await connect(cookie);

    expect(await watching.next()).toEqual({ type: "elsewhere", place: "duel" });

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);
    await watching.settle();

    setNow(STARTS_AT + 11_000);
    expect(await alan.next()).toMatchObject({ type: "duel-ended", outcome: "win", forfeit: true });
    // The end waits for a tab that resumes the Duel: the open one, here.
    await watching.settle();
    watching.send({ type: "resume-duel" });
    expect(await watching.next()).toMatchObject({ type: "duel-ended", outcome: "loss" });
  });

  test("another open tab can resume the Duel within the time to come back", async () => {
    const { cookie, ada, alan } = await pairedUsers();
    const watching = await connect(cookie);

    expect(await watching.next()).toEqual({ type: "elsewhere", place: "duel" });

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);

    setNow(STARTS_AT + 5000);
    watching.send({ type: "resume-duel" });
    expect(await watching.next()).toMatchObject({ type: "duel-resumed" });
    expect(await alan.next()).toEqual({ type: "opponent-reconnected" });

    setNow(STARTS_AT + 20_000);
    await alan.settle();
  });

  test("resuming outside a Duel is ignored", async () => {
    const ada = await connect(await signedIn("Ada"));

    expect(await ada.next()).toEqual({ type: "idle" });
    ada.send({ type: "resume-duel" });
    await ada.settle();
  });

  test("typing more than 40 Keystrokes in a second is a Forfeit", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 5000);
    // 41 Keystrokes in 960 ms, over two batches.
    ada.send({ type: "keystrokes", keystrokes: burst(20, 1000, 24) });
    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });
    ada.send({ type: "keystrokes", keystrokes: burst(21, 1480, 24) });

    expect(await ada.next()).toMatchObject({ type: "duel-ended", outcome: "loss", forfeit: true });
    expect(await alan.next()).toMatchObject({ type: "duel-ended", outcome: "win", forfeit: true });
  });

  test("40 Keystrokes a second is still human", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 5000);
    // Any 41 Keystrokes in a row span exactly one second.
    ada.send({ type: "keystrokes", keystrokes: burst(81, 1000, 25) });

    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });
    await ada.settle();
  });

  test("a Duel won at the end is written once, with both Results, Scores and Keystrokes", async () => {
    const { ada, alan, adaId, alanId, found } = await pairedUsers();
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    await alan.next();
    alan.send({ type: "keystrokes", keystrokes: [char("x", 3000)] });
    await ada.next();

    // Still running: nothing written.
    setNow(ENDS_AT - 1);
    await ada.settle();
    expect(saved).toEqual([]);

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    const duel = duelOf(found);

    if (duel === null) {
      throw new Error(`No Duel found: ${found.type}`);
    }

    expect(saved).toEqual([
      {
        ...duel,
        mode: "time",
        endedAt: TIME_UP,
        outcome: "win",
        winnerId: adaId,
        players: [
          {
            userId: adaId,
            result: resultOf(forAda),
            pace: defaultPace,
            score: scoreOf(forAda),
            keystrokes: typed(word, 1000),
            // A first Queue: seeded at 600 from the default Pace, then a Placement win at K 60.
            rated: {
              before: { mmr: 600, rank: { placementsLeft: 5 } },
              after: { mmr: 630, rank: { placementsLeft: 4 } },
              tp: null,
            },
          },
          {
            userId: alanId,
            result: resultOf(forAlan),
            pace: defaultPace,
            score: scoreOf(forAlan),
            keystrokes: [char("x", 3000)],
            rated: {
              before: { mmr: 600, rank: { placementsLeft: 5 } },
              after: { mmr: 570, rank: { placementsLeft: 4 } },
              tp: null,
            },
          },
        ],
      },
    ]);

    // Both are told the id it was written under: the Duel to replay.
    expect(forAda).toMatchObject({ duelId: duel.id });
    expect(forAlan).toMatchObject({ duelId: duel.id });

    // Ended once: written once.
    setNow(ENDS_AT + 60_000);
    await ada.settle();
    expect(saved).toHaveLength(1);
  });

  test("the written Keystrokes replay on the Duel's Text to the written Results", async () => {
    const { ada, alan, found } = await pairedUsers({ adaWpms: [70] });
    const word = firstWordOf(found);

    setNow(STARTS_AT + 10_000);
    ada.send({ type: "keystrokes", keystrokes: [...typed(word, 1000), ...typed("oops", 3000)] });
    await alan.next();
    // A mistake, corrected, then the right word.
    alan.send({
      type: "keystrokes",
      keystrokes: [
        char("q", 2000),
        { kind: "backspace", at: 2200 },
        ...typed(word, 2500),
        { kind: "deleteWord", at: 6000 },
      ],
    });
    await ada.next();

    setNow(ENDS_AT);
    await Promise.all([ada.next(), alan.next()]);

    // After Ada's past Duel.
    const record = saved.at(-1);

    if (typeof record === "undefined") {
      throw new Error("No Duel written");
    }

    const config = {
      mode: record.mode,
      seconds: record.seconds,
      language: record.language,
      wordListVersion: record.wordListVersion,
      seed: record.seed,
    };

    const replayed = record.players.map((player) =>
      computeResult(config, player.keystrokes, record.seconds * 1000),
    );

    expect(replayed).toEqual(record.players.map((player) => player.result));

    // Each player went at their own Pace, written with them.
    const rescored = record.players.map((player) => {
      const { score, bestCombo, bursts } = computeScore(
        config,
        player.keystrokes,
        player.pace,
        record.seconds * 1000,
      );

      return { score, bestCombo, bursts };
    });

    expect(record.players.map((player) => player.pace)).toEqual([70, defaultPace]);
    expect(record.players.map((player) => player.score)).toEqual(rescored);
    // Not a trivial replay: both typed something that counts.
    expect(record.players.map((player) => player.result.wpm > 0)).toEqual([true, true]);
    expect(record.players.map((player) => (player.score?.score ?? 0) > 0)).toEqual([true, true]);
  });

  test("a Draw is written with no winner", async () => {
    const { ada, alan, found } = await pairedUsers();
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    alan.send({ type: "keystrokes", keystrokes: typed(word, 2000) });
    await Promise.all([ada.next(), alan.next()]);

    setNow(ENDS_AT);
    await Promise.all([ada.next(), alan.next()]);

    expect(saved).toMatchObject([{ outcome: "draw", winnerId: null, endedAt: TIME_UP }]);
  });

  test("leaving the Duel is written at once as a Forfeit won by the opponent", async () => {
    const { ada, alan, adaId, alanId } = await pairedUsers();

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: [char("s", 1000)] });
    await alan.next();
    ada.send({ type: "leave-duel" });
    await Promise.all([ada.next(), alan.next()]);

    expect(saved).toMatchObject([
      {
        outcome: "forfeit",
        winnerId: alanId,
        endedAt: STARTS_AT + 5000,
        players: [
          { userId: adaId, keystrokes: [char("s", 1000)] },
          { userId: alanId, keystrokes: [] },
        ],
      },
    ]);

    // The scheduled end does not write it again.
    setNow(ENDS_AT);
    await alan.settle();
    expect(saved).toHaveLength(1);
  });

  test("a player not back within 10 s is written as a Forfeit", async () => {
    const { ada, alan, alanId } = await pairedUsers();

    setNow(STARTS_AT + 1000);
    ada.socket.close();
    await ada.closed;
    expect(await alan.next()).toEqual({ type: "opponent-disconnected" });

    setNow(STARTS_AT + 11_000);
    await alan.next();

    expect(saved).toMatchObject([
      { outcome: "forfeit", winnerId: alanId, endedAt: STARTS_AT + 11_000 },
    ]);
  });

  test("a Pace still being read holds up no one behind in the Queue", async () => {
    const { clock } = manualClock(NOW);
    const duels = memoryDuelStore();
    const adaUser = await signedInUser("Ada");
    const adaWpms = Promise.withResolvers<number[]>();

    // The MMR of the default Pace, whatever hers: Hopper's window fits her.
    duels.ratings.set(adaUser.id, {
      mmr: seedMmr(defaultPace),
      rank: { placementsLeft: PLACEMENT_DUELS },
    });

    const slowForAda = {
      ...duels.store,
      recentWpms: (userId: string, count: number) =>
        userId === adaUser.id ? adaWpms.promise : duels.store.recentWpms(userId, count),
    };

    await app.stop(true);
    app = createApp(testConfig({ auth, clock, duelStore: slowForAda })).listen(0);
    url = `ws://localhost:${app.server?.port}/api/duel`;

    const ada = await queued(adaUser.cookie);
    const alan = await queued(await signedIn("Alan"));
    const grace = await queued(await signedIn("Grace"));

    expect(await alan.next()).toMatchObject({ type: "duel-found", opponent: { handle: "grace" } });
    expect(await grace.next()).toMatchObject({ type: "duel-found", opponent: { handle: "alan" } });
    await ada.settle();

    // Read at last: Ada waits for the next User.
    adaWpms.resolve([80]);

    const hopper = await queued(await signedIn("Hopper"));

    expect(await hopper.next()).toMatchObject({ type: "duel-found", opponentPace: 80 });
    expect(await ada.next()).toMatchObject({ type: "duel-found", pace: 80 });
  });

  test("a Duel that cannot be written still ends for both players, and the failure is logged", async () => {
    const { clock, set } = manualClock(NOW);
    const logged: string[] = [];
    const logger = pino({ level: "error" }, { write: (line: string) => logged.push(line) });

    const failing = {
      save: () => Promise.reject(new Error("database down")),
      recentWpms: () => Promise.reject(new Error("database down")),
      ensureRating: () => Promise.reject(new Error("database down")),
      history: () => Promise.reject(new Error("database down")),
      playedDuel: () => Promise.reject(new Error("database down")),
      stats: () => Promise.reject(new Error("database down")),
      progression: () => Promise.reject(new Error("database down")),
      recentDuelsOf: () => Promise.reject(new Error("database down")),
    };

    await app.stop(true);
    setNow = set;
    app = createApp(testConfig({ auth, clock, logger, duelStore: failing })).listen(0);
    url = `ws://localhost:${app.server?.port}/api/duel`;

    const { ada, alan, found } = await paired();

    // Without their history, both go at the default Pace.
    expect(found).toMatchObject({ pace: defaultPace, opponentPace: defaultPace });

    setNow(ENDS_AT);

    // Nothing written: nothing to replay, and no Rating moved (none was read: not ranked).
    expect(await ada.next()).toMatchObject({ type: "duel-ended", duelId: null, ranked: null });
    expect(await alan.next()).toMatchObject({ type: "duel-ended", duelId: null, ranked: null });
    expect(logged.map((line) => JSON.parse(line))).toMatchObject([
      { msg: "pace not read", err: { message: "database down" } },
      { msg: "rating not read", err: { message: "database down" } },
      { msg: "pace not read", err: { message: "database down" } },
      { msg: "rating not read", err: { message: "database down" } },
      { msg: "finished duel not saved", err: { message: "database down" } },
    ]);
  });

  test("a write that hangs does not hold the end: past its time, nothing to replay", async () => {
    const { clock, set } = manualClock(NOW);
    const logged: string[] = [];
    const logger = pino({ level: "warn" }, { write: (line: string) => logged.push(line) });
    const duels = memoryDuelStore();

    const hanging = { ...duels.store, save: () => new Promise<void>(() => {}) };

    await app.stop(true);
    setNow = set;
    app = createApp(testConfig({ auth, clock, logger, duelStore: hanging })).listen(0);
    url = `ws://localhost:${app.server?.port}/api/duel`;

    const { ada, alan } = await pairedUsers();

    setNow(ENDS_AT);
    await ada.settle();

    setNow(ENDS_AT + SAVE_TIMEOUT_MS);

    expect(await ada.next()).toMatchObject({ type: "duel-ended", duelId: null, ranked: null });
    expect(await alan.next()).toMatchObject({ type: "duel-ended", duelId: null, ranked: null });
    expect(logged.map((line) => JSON.parse(line))).toMatchObject([
      { msg: "finished duel not saved in time" },
    ]);
  });

  test("the end is told once the Duel is written: until then, the Duel is still the place", async () => {
    const { clock, set } = manualClock(NOW);
    const duels = memoryDuelStore();
    const written = Promise.withResolvers<void>();

    const slowToWrite = {
      ...duels.store,
      save: async (record: DuelRecord) => {
        await written.promise;
        await duels.store.save(record);
      },
    };

    await app.stop(true);
    setNow = set;
    app = createApp(testConfig({ auth, clock, duelStore: slowToWrite })).listen(0);
    url = `ws://localhost:${app.server?.port}/api/duel`;

    const { ada, alan, cookie } = await pairedUsers();

    setNow(ENDS_AT);
    await ada.settle();

    // Still being written: a tab opened now sees the Duel, joining the Queue is ignored.
    const other = await connect(cookie);

    expect(await other.next()).toEqual({ type: "elsewhere", place: "duel" });
    ada.send({ type: "join-queue" });
    await ada.settle();

    written.resolve();

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);
    const duelId = duels.saved.at(0)?.id;

    expect(duelId).toBeString();
    expect(forAda).toMatchObject({ type: "duel-ended", duelId });
    expect(forAlan).toMatchObject({ type: "duel-ended", duelId });
    expect(await other.next()).toEqual({ type: "idle" });
  });

  // Ada and Alan, with their Ratings given before they join, paired at NOW.
  const rankedPair = async (adaRating: Rating, alanRating: Rating) => {
    const adaUser = await signedInUser("Ada");
    const alanUser = await signedInUser("Alan");

    ratings.set(adaUser.id, adaRating);
    ratings.set(alanUser.id, alanRating);

    const ada = await queuedLongAgo(adaUser.cookie);
    const alan = await queued(alanUser.cookie);
    const [found] = await Promise.all([ada.next(), alan.next()]);

    return { ada, alan, adaId: adaUser.id, alanId: alanUser.id, found };
  };

  // Ada and Alan queued at NOW with these MMRs, neither paired yet.
  const queuedApart = async (adaMmr: number, alanMmr: number) => {
    const adaUser = await signedInUser("Ada");
    const alanUser = await signedInUser("Alan");

    ratings.set(adaUser.id, { mmr: adaMmr, rank: orIv(50) });
    ratings.set(alanUser.id, { mmr: alanMmr, rank: orIv(50) });

    const ada = await queued(adaUser.cookie);
    const alan = await queued(alanUser.cookie);

    await Promise.all([ada.settle(), alan.settle()]);

    return { ada, alan };
  };

  describe("Queue window", () => {
    test("pairs at once two Users within ±100 MMR", async () => {
      const ada = await queued(await signedIn("Ada"));
      const alan = await queued(await signedIn("Alan"));

      // Both at the default Pace: the same MMR.
      expect(await ada.next()).toEqual(duelFound("Alan"));
      expect(await alan.next()).toEqual(duelFound("Ada"));
    });

    test("holds two Users too far apart until the window widens to their gap", async () => {
      const { ada, alan } = await queuedApart(1000, 1250);

      // 150 after 5 s, 200 after 10 s: still too far apart.
      setNow(NOW + 10_000);
      await Promise.all([ada.settle(), alan.settle()]);

      // 250 after 15 s.
      setNow(NOW + 15_000);

      const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

      expect(forAda).toMatchObject({ type: "duel-found", serverTime: NOW + 15_000 });
      expect(forAlan).toMatchObject({ type: "duel-found", serverTime: NOW + 15_000 });
    });

    test("pairs any two Users after 30 s of waiting", async () => {
      const { ada, alan } = await queuedApart(600, 1800);

      setNow(NOW + 29_999);
      await Promise.all([ada.settle(), alan.settle()]);
      setNow(NOW + 30_000);

      const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

      expect(forAda).toMatchObject({ type: "duel-found", serverTime: NOW + 30_000 });
      expect(forAlan).toMatchObject({ type: "duel-found", serverTime: NOW + 30_000 });
    });

    test("the window is the one of the User who waited longer", async () => {
      const adaUser = await signedInUser("Ada");
      const alanUser = await signedInUser("Alan");

      ratings.set(adaUser.id, { mmr: 1000, rank: orIv(50) });
      ratings.set(alanUser.id, { mmr: 1200, rank: orIv(50) });

      const ada = await queued(adaUser.cookie);

      // Ada has waited 10 s: her window is 200, Alan's first one only 100.
      setNow(NOW + 10_000);

      const alan = await queued(alanUser.cookie);

      expect(await ada.next()).toMatchObject({ type: "duel-found", serverTime: NOW + 10_000 });
      expect(await alan.next()).toMatchObject({ type: "duel-found" });
    });

    test("pairs the first User who fits, not the first in the Queue", async () => {
      const [adaUser, alanUser, graceUser] = await Promise.all([
        signedInUser("Ada"),
        signedInUser("Alan"),
        signedInUser("Grace"),
      ]);

      ratings.set(adaUser.id, { mmr: 1000, rank: orIv(50) });
      ratings.set(alanUser.id, { mmr: 1500, rank: orIv(50) });
      ratings.set(graceUser.id, { mmr: 1050, rank: orIv(50) });

      const ada = await queued(adaUser.cookie);
      const alan = await queued(alanUser.cookie);
      const grace = await queued(graceUser.cookie);

      expect(await ada.next()).toEqual(duelFound("Grace"));
      expect(await grace.next()).toEqual(duelFound("Ada"));
      await alan.settle();
    });
  });

  describe("ranked", () => {
    test("a first join of the Queue seeds the Rating from the Pace, in Placement", async () => {
      const { ada, alan, adaId } = await pairedUsers({ adaWpms: [70] });

      // Ada's Pace of 70 wpm: 600 + 20 × 12. Alan's default Pace of 50: 600.
      expect(ratings.get(adaId)).toEqual({ mmr: 840, rank: { placementsLeft: 5 } });

      setNow(ENDS_AT);

      const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

      // A Placement Duel: no TP, one Placement fewer.
      expect(forAda).toMatchObject({
        ranked: { tp: null, previousRank: { placementsLeft: 5 }, rank: { placementsLeft: 4 } },
      });
      expect(forAlan).toMatchObject({
        ranked: { tp: null, previousRank: { placementsLeft: 5 }, rank: { placementsLeft: 4 } },
      });
    });

    test("a win moves both Ratings, each told their TP and ranks, never the MMR", async () => {
      const { ada, alan, adaId, alanId, found } = await rankedPair(
        { mmr: 1000, rank: orIv(50) },
        { mmr: 1000, rank: orIv(50) },
      );

      setNow(STARTS_AT + 5000);
      ada.send({ type: "keystrokes", keystrokes: typed(firstWordOf(found), 1000) });
      await alan.next();
      setNow(ENDS_AT);

      const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

      expect(endedOf(forAda).ranked).toEqual({ tp: 20, previousRank: orIv(50), rank: orIv(70) });
      expect(endedOf(forAlan).ranked).toEqual({ tp: -20, previousRank: orIv(50), rank: orIv(30) });
      expect(ratings.get(adaId)).toEqual({ mmr: 1016, rank: orIv(70) });
      expect(ratings.get(alanId)).toEqual({ mmr: 984, rank: orIv(30) });
    });

    test("a Forfeit is a full loss, whatever the Score so far", async () => {
      const { ada, alan, found } = await rankedPair(
        { mmr: 1000, rank: orIv(50) },
        { mmr: 1000, rank: orIv(50) },
      );

      setNow(STARTS_AT + 5000);
      ada.send({ type: "keystrokes", keystrokes: typed(firstWordOf(found), 1000) });
      await alan.next();
      ada.send({ type: "leave-duel" });

      const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

      expect(endedOf(forAda).ranked).toMatchObject({ tp: -20, rank: orIv(30) });
      expect(endedOf(forAlan).ranked).toMatchObject({ tp: 20, rank: orIv(70) });
    });

    test("a Draw counts as half a win: drawing a stronger opponent moves up", async () => {
      const { ada, alan } = await rankedPair(
        { mmr: 1000, rank: orIv(50) },
        { mmr: 1400, rank: diamantIv(50) },
      );

      setNow(ENDS_AT);

      const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

      expect(forAda).toMatchObject({ outcome: "draw", ranked: { tp: 16, rank: orIv(66) } });
      expect(forAlan).toMatchObject({ outcome: "draw", ranked: { tp: -16, rank: diamantIv(34) } });
    });

    test("the last Placement reveals the rank the MMR reached", async () => {
      const { ada } = await rankedPair(
        { mmr: 1000, rank: { placementsLeft: 1 } },
        { mmr: 1000, rank: orIv(50) },
      );

      setNow(ENDS_AT);

      // A Draw at 1000: the MMR stays, Or IV at 0 TP.
      expect(endedOf(await ada.next()).ranked).toEqual({
        tp: null,
        previousRank: { placementsLeft: 1 },
        rank: orIv(0),
      });
    });

    test("the Rating of the next Duel is the one the last Duel wrote", async () => {
      const { ada, alan, adaId, alanId } = await rankedPair(
        { mmr: 1000, rank: orIv(50) },
        { mmr: 1000, rank: orIv(50) },
      );

      ada.send({ type: "leave-duel" });
      await Promise.all([ada.next(), alan.next()]);

      ada.send({ type: "join-queue" });
      expect(await ada.next()).toEqual({ type: "queued" });
      alan.send({ type: "join-queue" });
      expect(await alan.next()).toEqual({ type: "queued" });
      await Promise.all([ada.next(), alan.next()]);
      alan.send({ type: "leave-duel" });

      const [forAda] = await Promise.all([ada.next(), alan.next()]);

      expect(endedOf(forAda).ranked).toMatchObject({ previousRank: orIv(30) });
      expect(ratings.get(adaId)?.mmr).toBeGreaterThan(984);
      expect(ratings.get(alanId)?.mmr).toBeLessThan(1016);
    });
  });
});
