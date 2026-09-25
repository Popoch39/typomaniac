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

const NOW = 1_700_000_000_000;

// Two Users paired from the Queue, then the first forfeits: the Duel is written at once.
const duel = async (loser: TestClient, winner: TestClient) => {
  loser.send({ type: "join-queue" });
  expect(await loser.next()).toEqual({ type: "queued" });
  winner.send({ type: "join-queue" });
  expect(await winner.next()).toEqual({ type: "queued" });
  expect(await loser.next()).toMatchObject({ type: "duel-found" });
  expect(await winner.next()).toMatchObject({ type: "duel-found" });
  loser.send({ type: "leave-duel" });

  const ended = await loser.next();

  expect(await winner.next()).toMatchObject({ type: "duel-ended" });

  if (ended.type !== "duel-ended" || ended.duelId === null) {
    throw new Error(`Not a written Duel's end: ${JSON.stringify(ended)}`);
  }

  return ended.duelId;
};

describe("Activity, live on the socket", () => {
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

  const post = async (cookie: string, path: string, body?: { userId: string }) => {
    const response = await fetch(`http://${origin}/api${path}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    expect(response.status).toBe(200);
  };

  // A User with a Handle, their name lowercased.
  const newUser = async (name: string) => {
    users += 1;

    const image = `https://example.com/${users}.png`;

    const { user, cookie } = await signIn(auth, {
      name,
      email: `${name.toLowerCase()}-${users}@example.com`,
      image,
      handle: name.toLowerCase(),
    });

    return { id: user.id, handle: name.toLowerCase(), image, cookie };
  };

  type TestUser = Awaited<ReturnType<typeof newUser>>;

  const befriend = async (a: TestUser, b: TestUser) => {
    await post(a.cookie, "/friend-requests", { userId: b.id });
    await post(b.cookie, `/friend-requests/received/${a.id}/accept`);
  };

  // A tab of the User, once told their place and given the snapshot of their Friends.
  const tab = async (user: TestUser) => {
    const client = openClient(`ws://${origin}/api/duel`, user.cookie);

    clients.push(client);
    await client.opened;
    expect(await client.next()).toEqual({ type: "idle" });
    expect(await client.nextFriends()).toMatchObject({ type: "friends-snapshot" });

    return client;
  };

  const player = (user: TestUser, outcome: "win" | "loss") => ({
    id: user.id,
    handle: user.handle,
    image: user.image,
    wpm: 0,
    outcome,
  });

  const profile = ({ id, handle, image }: TestUser) => ({ id, handle, image });

  test("a Friend's Duel reaches their Friends, against a stranger too, never the others", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const carol = await newUser("Carol");
    const grace = await newUser("Grace");

    await befriend(ada, alan);

    const alanTab = await tab(alan);
    const graceTab = await tab(grace);
    const adaTab = await tab(ada);
    const carolTab = await tab(carol);

    const duelId = await duel(adaTab, carolTab);

    expect(await alanTab.nextActivity()).toEqual({
      type: "activity-added",
      activity: {
        type: "duel",
        id: duelId,
        at: NOW,
        forfeit: true,
        friend: player(ada, "loss"),
        opponent: player(carol, "win"),
      },
    });
    await alanTab.settleActivity();
    await graceTab.settleActivity();
    // Their own Duel against a stranger is not in their Activity.
    await adaTab.settleActivity();
    await carolTab.settleActivity();
  });

  test("a Duel between two Friends reaches each once, and each of the two", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const bob = await newUser("Bob");

    await befriend(ada, alan);
    await befriend(bob, ada);
    await befriend(bob, alan);

    const bobTab = await tab(bob);
    const adaTab = await tab(ada);
    const alanTab = await tab(alan);

    const duelId = await duel(adaTab, alanTab);

    expect(await bobTab.nextActivity()).toMatchObject({
      activity: { type: "duel", id: duelId },
    });
    // Each of the two sees it with the other as the Friend.
    expect(await adaTab.nextActivity()).toMatchObject({
      activity: { id: duelId, friend: { id: alan.id }, opponent: { id: ada.id } },
    });
    expect(await alanTab.nextActivity()).toMatchObject({
      activity: { id: duelId, friend: { id: ada.id }, opponent: { id: alan.id } },
    });
    await bobTab.settleActivity();
    await adaTab.settleActivity();
    await alanTab.settleActivity();
  });

  test("a new friendship reaches both, and each Friend of either once", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const bob = await newUser("Bob");
    const grace = await newUser("Grace");
    const linus = await newUser("Linus");

    await befriend(bob, ada);
    await befriend(grace, ada);
    await befriend(grace, alan);

    const bobTab = await tab(bob);
    const graceTab = await tab(grace);
    const linusTab = await tab(linus);
    const adaTab = await tab(ada);
    const alanTab = await tab(alan);

    await befriend(ada, alan);

    const id = [ada.id, alan.id].toSorted().join(":");

    expect(await bobTab.nextActivity()).toEqual({
      type: "activity-added",
      activity: { type: "friendship", id, at: NOW, friend: profile(ada), other: profile(alan) },
    });
    expect(await graceTab.nextActivity()).toMatchObject({ activity: { type: "friendship", id } });
    expect(await adaTab.nextActivity()).toMatchObject({
      activity: { id, friend: profile(alan), other: profile(ada) },
    });
    expect(await alanTab.nextActivity()).toMatchObject({
      activity: { id, friend: profile(ada), other: profile(alan) },
    });

    await Promise.all(
      [bobTab, graceTab, linusTab, adaTab, alanTab].map((client) => client.settleActivity()),
    );
  });

  test("a Friend's arrival online reaches their Friends at once, never the others nor the read", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const grace = await newUser("Grace");

    await befriend(ada, alan);

    const alanTab = await tab(alan);
    const graceTab = await tab(grace);
    const adaTab = await tab(ada);

    expect(await alanTab.nextArrival()).toEqual({
      type: "friend-arrived",
      arrival: { id: expect.any(String), at: NOW, friend: profile(ada) },
    });
    await alanTab.settleArrivals();
    await graceTab.settleArrivals();
    await adaTab.settleArrivals();

    const response = await fetch(`http://${origin}/api/activity`, {
      headers: { cookie: alan.cookie },
    });

    // Only their friendship: the arrival is never kept.
    expect(await response.json()).toMatchObject([{ type: "friendship" }]);
  });

  test("a second tab, a Duel or going offline tells no arrival", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const carol = await newUser("Carol");

    await befriend(ada, alan);

    const alanTab = await tab(alan);
    const adaTab = await tab(ada);

    expect(await alanTab.nextFriends()).toMatchObject({ presence: "online" });
    expect(await alanTab.nextArrival()).toMatchObject({ arrival: { friend: profile(ada) } });

    const secondTab = await tab(ada);
    const carolTab = await tab(carol);

    await duel(adaTab, carolTab);
    adaTab.socket.close();
    secondTab.socket.close();
    expect(await alanTab.nextFriends()).toMatchObject({ presence: "in-duel" });
    expect(await alanTab.nextFriends()).toMatchObject({ presence: "online" });
    expect(await alanTab.nextFriends()).toMatchObject({ presence: "offline" });
    await alanTab.settleArrivals();
  });
});
