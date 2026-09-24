import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import pino from "pino";
import { computeResult, currentWordListVersion, generateText } from "typing-engine";

import { createApp } from "../app";
import {
  createTestAuth,
  manualClock,
  memoryDuelStore,
  signIn,
  type TestAuth,
  testConfig,
} from "../test-app";
import type { DuelRecord } from "./duel-store";
import { type ClientMessage, MAX_DUEL_MESSAGE_SIZE, ServerMessage } from "./protocol";
import { END_TOLERANCE_MS } from "./running-duel";

const NOW = 1_700_000_000_000;

// A Duel paired at NOW starts after the 3 s Countdown and lasts 30 s.
const STARTS_AT = NOW + 3000;

// The server ends it once the last Keystrokes had the time to arrive.
const ENDS_AT = STARTS_AT + 30_000 + END_TOLERANCE_MS;

const char = (value: string, at: number) => ({ kind: "char" as const, char: value, at });

const serverMessage = TypeCompiler.Compile(ServerMessage);

const duelOf = (message: ServerMessage) =>
  message.type === "duel-found" || message.type === "duel-resumed" ? message.duel : null;

// The Result a player is told at the end of their Duel.
const resultOf = (message: ServerMessage) => {
  if (message.type !== "duel-ended") {
    throw new Error(`Not the end of a Duel: ${message.type}`);
  }

  return message.result;
};

// The first word of the Duel's Text: typed right with its space, it is worth (length + 1) chars
// in 30 s, so (length + 1) / 5 / 0.5 wpm.
const firstWordOf = (message: ServerMessage) => {
  const duel = duelOf(message);

  return duel === null ? "" : (generateText(duel.seed, "en", duel.wordListVersion, 1)[0] ?? "");
};

// A word and its space, one Keystroke every 100 ms from `start`.
const typed = (word: string, start: number) =>
  [...`${word} `].map((value, i) => char(value, start + i * 100));

// `count` Keystrokes, one every `every` ms from `start`: the letters of the alphabet in turn.
const burst = (count: number, start: number, every: number) =>
  Array.from({ length: count }, (_, i) =>
    char(String.fromCodePoint(97 + (i % 26)), start + i * every),
  );

const duelFound = (opponent: string) => ({
  type: "duel-found" as const,
  duel: expect.any(Object),
  opponent: { name: opponent, image: `https://img/${opponent.toLowerCase()}` },
  serverTime: NOW,
});

// A browser tab on the Duel socket: every message it receives, read in order with next().
const openClient = (url: string, cookie?: string) => {
  const socket = new WebSocket(url, { headers: cookie ? { cookie } : {} });
  const inbox: ServerMessage[] = [];
  const waiting: ((message: ServerMessage) => void)[] = [];

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));

    if (!serverMessage.Check(message)) {
      throw new Error(`Not a server message: ${String(event.data)}`);
    }

    const resolve = waiting.shift();

    if (resolve) {
      resolve(message);
    } else {
      inbox.push(message);
    }
  });

  const closed = new Promise<number>((resolve) => {
    socket.addEventListener("close", (event) => resolve(event.code));
  });

  // Resolves once connected, or to false when the server refuses the upgrade.
  const opened = Promise.race([
    new Promise<boolean>((resolve) => socket.addEventListener("open", () => resolve(true))),
    closed.then(() => false),
  ]);

  const next = () =>
    new Promise<ServerMessage>((resolve) => {
      const message = inbox.shift();

      if (message) {
        resolve(message);
      } else {
        waiting.push(resolve);
      }
    });

  const send = (message: ClientMessage) => socket.send(JSON.stringify(message));

  // A round trip: the server answers a malformed message, so anything it sent before is
  // already received. Proves that nothing else is on its way.
  const settle = async () => {
    socket.send("not a message");

    expect(await next()).toEqual({ type: "invalid-message" });
    expect(inbox).toEqual([]);
  };

  return { socket, opened, closed, next, send, settle };
};

describe("duel socket", () => {
  let auth: TestAuth;
  let app: ReturnType<typeof createApp>;
  let url: string;
  const clients: ReturnType<typeof openClient>[] = [];

  // The server's time, moved by hand.
  let setNow: (time: number) => void;

  // The finished Duels written by the server.
  let saved: DuelRecord[];

  beforeEach(() => {
    const { clock, set } = manualClock(NOW);
    const duels = memoryDuelStore();

    setNow = set;
    saved = duels.saved;
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

  // A new User, with the cookie of their Session.
  const signedInUser = async (name: string) => {
    users += 1;

    const { user, cookie } = await signIn(auth, {
      name,
      email: `${name.toLowerCase()}-${users}@example.com`,
      image: `https://img/${name.toLowerCase()}`,
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
      opponent: { name: "Ada", image: "https://img/ada" },
      serverTime: NOW,
    });
    expect(forAda).toEqual(duelFound("Alan"));
    // The very same Duel (id, Seed, start), only the opponent differs.
    expect(duelOf(forAda)).toEqual(duelOf(forAlan));
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

  test("a second tab takes the place of the first, which is closed", async () => {
    const cookie = await signedIn("Ada");
    const firstTab = await queued(cookie);

    const secondTab = await connect(cookie);

    expect(await firstTab.next()).toEqual({ type: "replaced" });
    expect(await firstTab.closed).toBe(1000);
    expect(await secondTab.next()).toEqual({ type: "queued" });

    // Joining again from the second tab: still one place, never paired against herself.
    secondTab.send({ type: "join-queue" });
    expect(await secondTab.next()).toEqual({ type: "queued" });
    await secondTab.settle();

    const alan = await queued(await signedIn("Alan"));

    expect(await secondTab.next()).toEqual(duelFound("Alan"));
    expect(await alan.next()).toEqual(duelFound("Ada"));
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

  // Ada and Alan, paired at NOW, each Duel found read.
  const paired = async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));

    await Promise.all([ada.next(), alan.next()]);

    return { ada, alan };
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

  test("the best wpm wins, and both see the same Results", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    await alan.next();

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    expect(forAda).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      forfeit: false,
      result: { wpm: (word.length + 1) / 5 / 0.5, accuracy: 100 },
      opponentResult: { wpm: 0, accuracy: 0 },
      opponent: { name: "Alan", image: "https://img/alan" },
    });
    expect(forAlan).toMatchObject({
      type: "duel-ended",
      outcome: "loss",
      forfeit: false,
      opponent: { name: "Ada" },
    });

    const ended = [forAda, forAlan].map((message) =>
      message.type === "duel-ended" ? message : null,
    );

    expect(ended[0]?.result).toEqual(ended[1]?.opponentResult);
    expect(ended[0]?.opponentResult).toEqual(ended[1]?.result);
  });

  test("the same wpm and accuracy is a Draw for both", async () => {
    const ada = await queued(await signedIn("Ada"));
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);
    const word = firstWordOf(found);

    setNow(STARTS_AT + 5000);
    ada.send({ type: "keystrokes", keystrokes: typed(word, 1000) });
    alan.send({ type: "keystrokes", keystrokes: typed(word, 2000) });
    await Promise.all([ada.next(), alan.next()]);

    setNow(ENDS_AT);

    const [forAda, forAlan] = await Promise.all([ada.next(), alan.next()]);

    expect(forAda).toMatchObject({ type: "duel-ended", outcome: "draw" });
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "draw" });
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
    expect(await ada.next()).toMatchObject({ type: "duel-found", opponent: { name: "Alan" } });
  });

  // Ada and Alan paired, and the cookie Ada signed in with, to reconnect.
  const pairedWithCookie = async () => {
    const cookie = await signedIn("Ada");
    const ada = await queued(cookie);
    const alan = await queued(await signedIn("Alan"));
    const [found] = await Promise.all([ada.next(), alan.next()]);

    return { cookie, ada, alan, found };
  };

  // Ada's connection drops: Alan is told.
  const dropped = async (
    ada: ReturnType<typeof openClient>,
    alan: ReturnType<typeof openClient>,
  ) => {
    ada.socket.close();
    await ada.closed;
    expect(await alan.next()).toEqual({ type: "opponent-disconnected" });
  };

  test("leaving the Duel is an immediate Forfeit, the opponent wins", async () => {
    const { ada, alan } = await paired();

    setNow(STARTS_AT + 5000);
    ada.send({ type: "leave-duel" });

    expect(await ada.next()).toMatchObject({
      type: "duel-ended",
      outcome: "loss",
      forfeit: true,
      opponent: { name: "Alan" },
    });
    expect(await alan.next()).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      forfeit: true,
      opponent: { name: "Ada" },
    });

    // Over for both: the scheduled end does not end it again.
    setNow(ENDS_AT);
    await ada.settle();
    await alan.settle();
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
    const { cookie, ada, alan, found } = await pairedWithCookie();

    setNow(STARTS_AT + 1000);
    ada.send({ type: "keystrokes", keystrokes: [char("s", 100), char("m", 2000)] });
    expect(await alan.next()).toMatchObject({ type: "opponent-keystrokes" });
    expect(await ada.next()).toMatchObject({ type: "resync" });
    alan.send({ type: "keystrokes", keystrokes: [char("h", 400)] });
    expect(await ada.next()).toMatchObject({ type: "opponent-keystrokes" });

    await dropped(ada, alan);

    setNow(STARTS_AT + 1000 + 9999);
    await alan.settle();

    // A new socket of the same User, as after a reload.
    const back = await connect(cookie);

    const resumed = await back.next();

    // The very Duel that was found.
    expect(duelOf(resumed)).toEqual(duelOf(found));
    expect(resumed).toEqual({
      type: "duel-resumed",
      duel: expect.any(Object),
      opponent: { name: "Alan", image: "https://img/alan" },
      serverTime: STARTS_AT + 1000 + 9999,
      keystrokes: [char("s", 100)],
      received: 2,
      opponentKeystrokes: [char("h", 400)],
      opponentConnected: true,
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
    const { cookie, ada, alan } = await pairedWithCookie();

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);

    setNow(STARTS_AT + 11_000);
    expect(await alan.next()).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      forfeit: true,
      opponent: { name: "Ada" },
    });

    const back = await connect(cookie);

    expect(await back.next()).toMatchObject({
      type: "duel-ended",
      outcome: "loss",
      forfeit: true,
      opponent: { name: "Alan" },
    });

    // Told once: free for a new Duel.
    back.send({ type: "join-queue" });
    expect(await back.next()).toEqual({ type: "queued" });
  });

  test("a second disconnection gets its own 10 s", async () => {
    const { cookie, ada, alan } = await pairedWithCookie();

    setNow(STARTS_AT + 1000);
    await dropped(ada, alan);

    setNow(STARTS_AT + 5000);

    const back = await connect(cookie);

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
    const { cookie, ada, alan } = await pairedWithCookie();

    setNow(STARTS_AT + 1000);
    await dropped(alan, ada);
    ada.socket.close();
    await ada.closed;

    const back = await connect(cookie);

    expect(await back.next()).toMatchObject({ type: "duel-resumed", opponentConnected: false });
  });

  test("a Duel whose end came while a player was away tells them on their return", async () => {
    const { cookie, ada, alan } = await pairedWithCookie();

    setNow(ENDS_AT - 5000);
    await dropped(ada, alan);

    setNow(ENDS_AT);
    expect(await alan.next()).toMatchObject({ type: "duel-ended", forfeit: false });

    // The 10 s run out after the end: nothing more.
    setNow(ENDS_AT + 10_000);
    await alan.settle();

    const back = await connect(cookie);

    expect(await back.next()).toMatchObject({ type: "duel-ended", forfeit: false });
    await back.settle();
  });

  test("a second tab during a Duel resumes it there, the opponent is not told", async () => {
    const { cookie, ada, alan } = await pairedWithCookie();

    setNow(STARTS_AT + 1000);

    const secondTab = await connect(cookie);

    expect(await ada.next()).toEqual({ type: "replaced" });
    expect(await secondTab.next()).toMatchObject({
      type: "duel-resumed",
      opponent: { name: "Alan" },
      opponentConnected: true,
    });
    await alan.settle();

    // The first tab is closed, but the User is still there: no Forfeit.
    setNow(STARTS_AT + 20_000);
    await alan.settle();
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

  // Ada and Alan paired, with their User ids and the Duel found.
  const pairedUsers = async () => {
    const adaUser = await signedInUser("Ada");
    const alanUser = await signedInUser("Alan");
    const ada = await queued(adaUser.cookie);
    const alan = await queued(alanUser.cookie);
    const [found] = await Promise.all([ada.next(), alan.next()]);

    return { ada, alan, adaId: adaUser.id, alanId: alanUser.id, found };
  };

  test("a Duel won at the end is written once, with both Results and Keystrokes", async () => {
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
        endedAt: ENDS_AT,
        outcome: "win",
        winnerId: adaId,
        players: [
          {
            userId: adaId,
            result: resultOf(forAda),
            keystrokes: typed(word, 1000),
          },
          {
            userId: alanId,
            result: resultOf(forAlan),
            keystrokes: [char("x", 3000)],
          },
        ],
      },
    ]);

    // Ended once: written once.
    setNow(ENDS_AT + 60_000);
    await ada.settle();
    expect(saved).toHaveLength(1);
  });

  test("the written Keystrokes replay on the Duel's Text to the written Results", async () => {
    const { ada, alan, found } = await pairedUsers();
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

    const [record] = saved;

    expect(record).toBeDefined();

    const replayed = record?.players.map((player) =>
      computeResult(
        {
          mode: record.mode,
          seconds: record.seconds,
          language: record.language,
          wordListVersion: record.wordListVersion,
          seed: record.seed,
        },
        player.keystrokes,
        record.seconds * 1000,
      ),
    );

    expect(replayed).toEqual(record?.players.map((player) => player.result));
    // Not a trivial replay: both typed something that counts.
    expect(record?.players.map((player) => player.result.wpm > 0)).toEqual([true, true]);
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

    expect(saved).toMatchObject([{ outcome: "draw", winnerId: null, endedAt: ENDS_AT }]);
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

  test("a Duel that cannot be written still ends for both players, and the failure is logged", async () => {
    const { clock, set } = manualClock(NOW);
    const logged: string[] = [];
    const logger = pino({ level: "error" }, { write: (line: string) => logged.push(line) });
    const failing = { save: () => Promise.reject(new Error("database down")) };

    await app.stop(true);
    setNow = set;
    app = createApp(testConfig({ auth, clock, logger, duelStore: failing })).listen(0);
    url = `ws://localhost:${app.server?.port}/api/duel`;

    const { ada, alan } = await paired();

    setNow(ENDS_AT);

    expect(await ada.next()).toMatchObject({ type: "duel-ended" });
    expect(await alan.next()).toMatchObject({ type: "duel-ended" });
    expect(logged.map((line) => JSON.parse(line))).toMatchObject([
      { msg: "finished duel not saved", err: { message: "database down" } },
    ]);
  });
});
