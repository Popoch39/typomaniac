import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createApp } from "../../app";
import {
  createTestAuth,
  manualClock,
  openClient,
  signIn,
  type TestAuth,
  type TestClient,
  testConfig,
} from "../../test-app";
import type { FriendMessage } from "./model";

const NOW = 1_700_000_000_000;

// The snapshot a tab gets on connection, Friends in any order.
const snapshot = (
  presences: Extract<FriendMessage, { type: "presence" }>[],
  requestsReceived = 0,
) => ({
  type: "friends-snapshot" as const,
  presences: expect.arrayContaining(
    presences.map(({ userId, presence }) => ({ userId, presence })),
  ),
  requestsReceived,
});

const presence = (
  userId: string,
  value: Extract<FriendMessage, { type: "presence" }>["presence"],
) => ({ type: "presence" as const, userId, presence: value });

const closed = async (client: TestClient) => {
  client.socket.close();
  await client.closed;
};

// Two Users paired from the Queue: their Duel's Countdown is on.
const paired = async (a: TestClient, b: TestClient) => {
  a.send({ type: "join-queue" });
  expect(await a.next()).toEqual({ type: "queued" });
  b.send({ type: "join-queue" });
  expect(await b.next()).toEqual({ type: "queued" });
  expect(await a.next()).toMatchObject({ type: "duel-found" });
  expect(await b.next()).toMatchObject({ type: "duel-found" });
};

// The body of a Friend request.
type SendBody = { userId: string };

describe("Presence and Friends, live on the socket", () => {
  let auth: TestAuth;
  let app: ReturnType<typeof createApp>;
  let origin: string;
  const clients: TestClient[] = [];

  beforeEach(() => {
    auth = createTestAuth();
    app = createApp(testConfig({ auth, clock: manualClock(NOW).clock })).listen(0);
    origin = `localhost:${app.server?.port}`;
  });

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.socket.close();
    }

    await app.stop(true);
  });

  let users = 0;

  const call = async (cookie: string, method: "POST" | "DELETE", path: string, body?: SendBody) => {
    const response = await fetch(`http://${origin}/api${path}`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    expect(response.status).toBe(200);
  };

  // A User with a Handle, their name lowercased, and their Friend actions over HTTP.
  const newUser = async (name: string) => {
    users += 1;

    const { user, cookie } = await signIn(auth, {
      name,
      email: `${name.toLowerCase()}-${users}@example.com`,
      handle: name.toLowerCase(),
    });

    return {
      id: user.id,
      cookie,
      send: async (to: string) => call(cookie, "POST", "/friend-requests", { userId: to }),
      cancel: async (to: string) => call(cookie, "DELETE", `/friend-requests/sent/${to}`),
      accept: async (from: string) =>
        call(cookie, "POST", `/friend-requests/received/${from}/accept`),
      decline: async (from: string) => call(cookie, "DELETE", `/friend-requests/received/${from}`),
      remove: async (friend: string) => call(cookie, "DELETE", `/friends/${friend}`),
    };
  };

  type TestUser = Awaited<ReturnType<typeof newUser>>;

  const befriend = async (a: TestUser, b: TestUser) => {
    await a.send(b.id);
    await b.accept(a.id);
  };

  // A tab of the User, once told their place (idle) and given the snapshot of their Friends.
  const tab = async (user: TestUser, friends: ReturnType<typeof snapshot> = snapshot([])) => {
    const client = openClient(`ws://${origin}/api/duel`, user.cookie);

    clients.push(client);
    await client.opened;
    expect(await client.next()).toEqual({ type: "idle" });
    expect(await client.nextFriends()).toEqual(friends);

    return client;
  };

  test("a Friend sees a User online, in a Duel, then offline; a non-Friend sees nothing", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const grace = await newUser("Grace");
    const carol = await newUser("Carol");

    await befriend(ada, alan);

    const alanTab = await tab(alan, snapshot([presence(ada.id, "offline")]));
    const graceTab = await tab(grace);
    const adaTab = await tab(ada, snapshot([presence(alan.id, "online")]));

    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "online"));

    // In the Queue, still online; in a Duel from the Countdown on.
    const carolTab = await tab(carol);

    await paired(adaTab, carolTab);
    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "in-duel"));

    // Over (a Forfeit): online again.
    adaTab.send({ type: "leave-duel" });
    expect(await adaTab.next()).toMatchObject({ type: "duel-ended" });
    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "online"));

    await closed(adaTab);
    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "offline"));

    await alanTab.settleFriends();
    await graceTab.settleFriends();
  });

  test("the snapshot holds each Friend's Presence and the Friend requests waiting", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const bob = await newUser("Bob");
    const carol = await newUser("Carol");
    const grace = await newUser("Grace");

    await befriend(ada, alan);
    await befriend(ada, bob);
    await befriend(ada, carol);
    await grace.send(ada.id);

    const alanTab = await tab(alan, snapshot([presence(ada.id, "offline")]));
    const carolTab = await tab(carol, snapshot([presence(ada.id, "offline")]));
    const graceTab = await tab(grace);

    await paired(carolTab, graceTab);

    const adaTab = await tab(
      ada,
      snapshot(
        [presence(alan.id, "online"), presence(bob.id, "offline"), presence(carol.id, "in-duel")],
        1,
      ),
    );

    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "online"));
    await adaTab.settleFriends();
    await alanTab.settleFriends();
  });

  test("with several tabs, a User goes offline only once the last one is closed", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const alanTab = await tab(alan, snapshot([presence(ada.id, "offline")]));
    const firstTab = await tab(ada, snapshot([presence(alan.id, "online")]));

    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "online"));

    // Each tab gets its snapshot; the second one changes nothing for Alan.
    const secondTab = await tab(ada, snapshot([presence(alan.id, "online")]));

    await closed(firstTab);
    await alanTab.settleFriends();

    await closed(secondTab);
    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "offline"));
  });

  test("a Friend request is pushed to its recipient, and once accepted both are Friends", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const adaTab = await tab(ada);
    const alanTab = await tab(alan);

    await ada.send(alan.id);
    expect(await alanTab.nextFriends()).toEqual({
      type: "friend-request-received",
      userId: ada.id,
      requestsReceived: 1,
    });
    await adaTab.settleFriends();

    await alan.accept(ada.id);
    expect(await adaTab.nextFriends()).toEqual({
      type: "friend-added",
      userId: alan.id,
      presence: "online",
      requestsReceived: 0,
    });
    expect(await alanTab.nextFriends()).toEqual({
      type: "friend-added",
      userId: ada.id,
      presence: "online",
      requestsReceived: 0,
    });

    // Friends now: each sees the other's Presence.
    await closed(adaTab);
    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "offline"));
  });

  test("Friend requests that cross make both Friends at once, pushed to both", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await alan.send(ada.id);

    const adaTab = await tab(ada, snapshot([], 1));
    const alanTab = await tab(alan);

    await ada.send(alan.id);
    expect(await adaTab.nextFriends()).toEqual({
      type: "friend-added",
      userId: alan.id,
      presence: "online",
      requestsReceived: 0,
    });
    expect(await alanTab.nextFriends()).toMatchObject({ type: "friend-added", userId: ada.id });
  });

  test("a cancelled Friend request is pushed to its recipient", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const alanTab = await tab(alan);

    await ada.send(alan.id);
    expect(await alanTab.nextFriends()).toMatchObject({ type: "friend-request-received" });

    await ada.cancel(alan.id);
    expect(await alanTab.nextFriends()).toEqual({
      type: "friend-request-removed",
      userId: ada.id,
      requestsReceived: 0,
    });
  });

  test("a declined Friend request reaches every tab of the recipient, never the sender", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const adaTab = await tab(ada);

    await ada.send(alan.id);

    const alanTab = await tab(alan, snapshot([], 1));
    const otherTab = await tab(alan, snapshot([], 1));

    await alan.decline(ada.id);

    const removed = {
      type: "friend-request-removed" as const,
      userId: ada.id,
      requestsReceived: 0,
    };

    expect(await alanTab.nextFriends()).toEqual(removed);
    expect(await otherTab.nextFriends()).toEqual(removed);
    await adaTab.settleFriends();
  });

  test("a Friend removed is told, and no longer sees the User's Presence", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const alanTab = await tab(alan, snapshot([presence(ada.id, "offline")]));
    const adaTab = await tab(ada, snapshot([presence(alan.id, "online")]));

    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "online"));

    await ada.remove(alan.id);
    expect(await adaTab.nextFriends()).toEqual({ type: "friend-removed", userId: alan.id });
    expect(await alanTab.nextFriends()).toEqual({ type: "friend-removed", userId: ada.id });

    await closed(adaTab);
    await alanTab.settleFriends();
  });

  test("a User offline when a friendship changes finds it in their next snapshot", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const alanTab = await tab(alan);

    await ada.send(alan.id);
    expect(await alanTab.nextFriends()).toMatchObject({ type: "friend-request-received" });
    await alan.accept(ada.id);
    expect(await alanTab.nextFriends()).toMatchObject({
      type: "friend-added",
      presence: "offline",
    });

    // Alan watches Ada from his accept on, although she was not connected then.
    await tab(ada, snapshot([presence(alan.id, "online")]));
    expect(await alanTab.nextFriends()).toEqual(presence(ada.id, "online"));
  });
});
