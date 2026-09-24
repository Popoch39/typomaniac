import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { currentWordListVersion, generateText } from "typing-engine";

import { createApp } from "../app";
import { createTestAuth, manualClock, signIn, type TestAuth, testConfig } from "../test-app";
import { type ClientMessage, MAX_DUEL_MESSAGE_SIZE, ServerMessage } from "./protocol";
import { END_TOLERANCE_MS } from "./running-duel";

const NOW = 1_700_000_000_000;

// A Duel paired at NOW starts after the 3 s Countdown and lasts 30 s.
const STARTS_AT = NOW + 3000;

// The server ends it once the last Keystrokes had the time to arrive.
const ENDS_AT = STARTS_AT + 30_000 + END_TOLERANCE_MS;

const char = (value: string, at: number) => ({ kind: "char" as const, char: value, at });

const serverMessage = TypeCompiler.Compile(ServerMessage);

const duelOf = (message: ServerMessage) => (message.type === "duel-found" ? message.duel : null);

// The first word of the Duel's Text: typed right with its space, it is worth (length + 1) chars
// in 30 s, so (length + 1) / 5 / 0.5 wpm.
const firstWordOf = (message: ServerMessage) => {
  const duel = duelOf(message);

  return duel === null ? "" : (generateText(duel.seed, "en", duel.wordListVersion, 1)[0] ?? "");
};

// A word and its space, one Keystroke every 100 ms from `start`.
const typed = (word: string, start: number) =>
  [...`${word} `].map((value, i) => char(value, start + i * 100));

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

  beforeEach(() => {
    const { clock, set } = manualClock(NOW);

    setNow = set;
    auth = createTestAuth();
    app = createApp(testConfig({ auth, clock })).listen(0);
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

  const signedIn = async (name: string) => {
    users += 1;

    const { cookie } = await signIn(auth, {
      name,
      email: `${name.toLowerCase()}-${users}@example.com`,
      image: `https://img/${name.toLowerCase()}`,
    });

    return cookie;
  };

  const queued = async (cookie: string) => {
    const client = await connect(cookie);

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

  test("rejects a malformed message and keeps the connection", async () => {
    const ada = await connect(await signedIn("Ada"));

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
      result: { wpm: (word.length + 1) / 5 / 0.5, accuracy: 100 },
      opponentResult: { wpm: 0, accuracy: 0 },
    });
    expect(forAlan).toMatchObject({ type: "duel-ended", outcome: "loss" });

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
});
