import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { currentWordListVersion } from "typing-engine";

import { createApp } from "../app";
import { createTestAuth, signIn, type TestAuth, testConfig } from "../test-app";
import { type ClientMessage, MAX_DUEL_MESSAGE_SIZE, ServerMessage } from "./protocol";

const NOW = 1_700_000_000_000;

const serverMessage = TypeCompiler.Compile(ServerMessage);

const duelOf = (message: ServerMessage) => (message.type === "duel-found" ? message.duel : null);

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

  beforeEach(() => {
    auth = createTestAuth();
    app = createApp(testConfig({ auth, clock: { now: () => NOW } })).listen(0);
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
        startsAt: NOW + 3000,
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
});
