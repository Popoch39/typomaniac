import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createApp } from "../../app";
import {
  createTestAuth,
  manualClock,
  memoryDuelStore,
  memoryFriendStore,
  openClient,
  signIn,
  type TestAuth,
  type TestClient,
  testConfig,
} from "../../test-app";
import type { FriendStore } from "../friend/store";
import type { ChallengeEnding, ChallengeMessage, ChallengeRefusal } from "./model";
import { CHALLENGE_MS } from "./service";

const NOW = 1_700_000_000_000;

type Received = Extract<ChallengeMessage, { type: "challenge-received" }>;

const ended = (challengeId: string, reason: ChallengeEnding): ChallengeMessage => ({
  type: "challenge-ended",
  challengeId,
  reason,
});

const closed = async (client: TestClient) => {
  client.socket.close();
  await client.closed;
};

// The tab challenges `userId` and is refused, nothing sent.
const refused = async (client: TestClient, userId: string, reason: ChallengeRefusal) => {
  client.send({ type: "send-challenge", userId });
  expect(await client.nextChallenge()).toEqual({ type: "challenge-refused", userId, reason });
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

describe("Challenges, on the socket", () => {
  let auth: TestAuth;
  let app: ReturnType<typeof createApp>;
  let origin: string;
  let clock: ReturnType<typeof manualClock>;
  let duels: ReturnType<typeof memoryDuelStore>;
  const clients: TestClient[] = [];

  // The next read of relations, once done, waits for `released` before it answers: a test forces a
  // race with it. `held` tells the test it is waiting.
  let holding: { held: () => void; released: Promise<void> } | null = null;

  beforeEach(() => {
    auth = createTestAuth();
    clock = manualClock(NOW);
    duels = memoryDuelStore();

    const friends = memoryFriendStore();

    const friendStore: FriendStore = {
      ...friends,
      relationsWith: async (userId, otherIds) => {
        const relations = await friends.relationsWith(userId, otherIds);
        const hold = holding;

        holding = null;

        if (hold) {
          hold.held();
          await hold.released;
        }

        return relations;
      },
    };

    app = createApp(
      testConfig({ auth, clock: clock.clock, duelStore: duels.store, friendStore }),
    ).listen(0);
    origin = `localhost:${app.server?.port}`;
  });

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.socket.close();
    }

    await app.stop(true);
  });

  let users = 0;

  const call = async (cookie: string, method: "POST" | "DELETE", path: string, userId?: string) => {
    const response = await fetch(`http://${origin}/api${path}`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: userId === undefined ? undefined : JSON.stringify({ userId }),
    });

    expect(response.status).toBe(200);
  };

  // A User, with a Handle (their name lowercased) unless told otherwise.
  const newUser = async (name: string, { handle = true } = {}) => {
    users += 1;

    const { user, cookie } = await signIn(auth, {
      name,
      email: `${name.toLowerCase()}-${users}@example.com`,
      image: `https://example.com/${name}.png`,
      handle: handle ? name.toLowerCase() : undefined,
    });

    return { id: user.id, handle: name.toLowerCase(), image: user.image ?? null, cookie };
  };

  type TestUser = Awaited<ReturnType<typeof newUser>>;

  const befriend = async (a: TestUser, b: TestUser) => {
    await call(a.cookie, "POST", "/friend-requests", b.id);
    await call(b.cookie, "POST", `/friend-requests/received/${a.id}/accept`);
  };

  // A tab of the User, once told their place, their Friends and their Challenges (none waiting,
  // unless given).
  const tab = async (
    user: TestUser,
    challenges: Partial<Extract<ChallengeMessage, { type: "challenges-snapshot" }>> = {},
  ) => {
    const client = openClient(`ws://${origin}/api/duel`, user.cookie);

    clients.push(client);
    await client.opened;
    expect(await client.next()).toMatchObject({ type: expect.any(String) });
    await client.nextFriends();
    expect(await client.nextChallenge()).toEqual({
      type: "challenges-snapshot",
      sent: null,
      received: [],
      serverTime: NOW,
      ...challenges,
    });

    return client;
  };

  const profile = ({ id, handle, image }: TestUser) => ({ id, handle, image });

  // `from` challenges `to`: the Challenge each of their tabs is told.
  const challenge = async (
    from: TestUser,
    fromTabs: TestClient[],
    to: TestUser,
    toTabs: TestClient[],
  ) => {
    const [sender] = fromTabs;

    sender?.send({ type: "send-challenge", userId: to.id });

    const received = await Promise.all(toTabs.map(async (client) => client.nextChallenge()));
    const sent = await Promise.all(fromTabs.map(async (client) => client.nextChallenge()));

    for (const message of received) {
      expect(message).toEqual({
        type: "challenge-received",
        challenge: {
          id: expect.any(String),
          from: profile(from),
          expiresAt: clock.clock.now() + CHALLENGE_MS,
        },
        serverTime: clock.clock.now(),
      });
    }

    for (const message of sent) {
      expect(message).toEqual({
        type: "challenge-sent",
        challenge: {
          id: expect.any(String),
          to: profile(to),
          expiresAt: clock.clock.now() + CHALLENGE_MS,
        },
        serverTime: clock.clock.now(),
      });
    }

    // SAFETY: every tab of the recipient was just checked to be told `challenge-received`.
    return (received[0] as Received).challenge.id;
  };

  test("an accepted Challenge starts the Duel on the tab that accepted and the one that sent", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    alanTab.send({ type: "accept-challenge", challengeId });
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "accepted"));
    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "accepted"));

    const alanFound = await alanTab.next();
    const adaFound = await adaTab.next();

    expect(alanFound).toMatchObject({
      type: "duel-found",
      duel: { language: "en", seconds: 30, startsAt: NOW + 4500 },
      opponent: { handle: "ada", image: ada.image },
      serverTime: NOW,
      // Never ranked: no rank to show.
      opponentRank: null,
    });
    expect(adaFound).toMatchObject({ type: "duel-found", opponent: { handle: "alan" } });

    // It counts like any Duel: written at its end. But it is never ranked: no Rating moves, none
    // is even created.
    clock.set(NOW + 4500 + 30_000 + 1000);
    expect(await alanTab.next()).toMatchObject({ type: "duel-ended", ranked: null });
    expect(await adaTab.next()).toMatchObject({ type: "duel-ended", ranked: null });
    expect(duels.saved).toMatchObject([{ players: [{ rated: null }, { rated: null }] }]);
    expect(duels.ratings.size).toBe(0);
  });

  test("a Challenge leaves the Ratings of ranked Users untouched", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const rating = { mmr: 1000, rank: { placementsLeft: 3 } };

    duels.ratings.set(ada.id, rating);
    duels.ratings.set(alan.id, rating);
    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    alanTab.send({ type: "accept-challenge", challengeId });
    await Promise.all([alanTab.next(), adaTab.next()]);
    adaTab.send({ type: "leave-duel" });

    expect(await alanTab.next()).toMatchObject({
      type: "duel-ended",
      outcome: "win",
      ranked: null,
    });
    expect(await adaTab.next()).toMatchObject({ type: "duel-ended", ranked: null });
    expect(duels.ratings.get(ada.id)).toEqual(rating);
    expect(duels.ratings.get(alan.id)).toEqual(rating);
  });

  test("a declined Challenge is over for both, and nothing starts", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    alanTab.send({ type: "decline-challenge", challengeId });
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "declined"));
    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "declined"));

    // Too late to accept it, and Ada may challenge again.
    alanTab.send({ type: "accept-challenge", challengeId });
    await alanTab.settle();
    await adaTab.settle();
    await challenge(ada, [adaTab], alan, [alanTab]);
  });

  test("the sender cancels their Challenge; the recipient cannot", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    alanTab.send({ type: "cancel-challenge", challengeId });
    await alanTab.settleChallenges();

    adaTab.send({ type: "cancel-challenge", challengeId });
    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "cancelled"));
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "cancelled"));
  });

  test("a Challenge not answered within 30 seconds expires", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    clock.set(NOW + CHALLENGE_MS - 1);
    await alanTab.settleChallenges();

    clock.set(NOW + CHALLENGE_MS);
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "expired"));
    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "expired"));

    alanTab.send({ type: "accept-challenge", challengeId });
    await alanTab.settle();
  });

  test("one Challenge sent at a time", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const grace = await newUser("Grace");

    await befriend(ada, alan);
    await befriend(ada, grace);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const graceTab = await tab(grace);

    await challenge(ada, [adaTab], alan, [alanTab]);

    await refused(adaTab, grace.id, "already-challenging");
    await graceTab.settleChallenges();
  });

  test("a Challenge to oneself, a non-Friend, or without a Handle is refused", async () => {
    const ada = await newUser("Ada");
    const carol = await newUser("Carol");
    const nobody = await newUser("Nobody", { handle: false });
    const adaTab = await tab(ada);
    const carolTab = await tab(carol);
    const nobodyTab = await tab(nobody);

    await refused(adaTab, ada.id, "self");
    await refused(adaTab, carol.id, "not-friends");
    await refused(nobodyTab, ada.id, "handle-required");
    await carolTab.settleChallenges();
  });

  test("a Challenge to a Friend offline or in a Duel is refused", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const grace = await newUser("Grace");
    const carol = await newUser("Carol");

    await befriend(ada, alan);
    await befriend(ada, grace);

    const adaTab = await tab(ada);

    await refused(adaTab, alan.id, "offline");

    const graceTab = await tab(grace);
    const carolTab = await tab(carol);

    await paired(graceTab, carolTab);
    await refused(adaTab, grace.id, "in-duel");
  });

  test("accepting takes both out of the Queue", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);

    alanTab.send({ type: "join-queue" });
    expect(await alanTab.next()).toEqual({ type: "queued" });

    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    alanTab.send({ type: "accept-challenge", challengeId });
    expect(await alanTab.next()).toMatchObject({ type: "duel-found", opponent: { handle: "ada" } });
    expect(await adaTab.next()).toMatchObject({ type: "duel-found", opponent: { handle: "alan" } });

    // Out of the Queue: nobody else is paired with Alan.
    const grace = await newUser("Grace");
    const graceTab = await tab(grace);

    graceTab.send({ type: "join-queue" });
    expect(await graceTab.next()).toEqual({ type: "queued" });
    await graceTab.settle();
  });

  test("of two Challenges received, accepting one ends the other", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const grace = await newUser("Grace");

    await befriend(ada, alan);
    await befriend(grace, alan);

    const adaTab = await tab(ada);
    const graceTab = await tab(grace);
    const alanTab = await tab(alan);
    const fromAda = await challenge(ada, [adaTab], alan, [alanTab]);
    const fromGrace = await challenge(grace, [graceTab], alan, [alanTab]);

    alanTab.send({ type: "accept-challenge", challengeId: fromGrace });

    const alanTold = [await alanTab.nextChallenge(), await alanTab.nextChallenge()];

    expect(alanTold).toEqual(
      expect.arrayContaining([ended(fromGrace, "accepted"), ended(fromAda, "unavailable")]),
    );
    expect(await adaTab.nextChallenge()).toEqual(ended(fromAda, "unavailable"));
    expect(await alanTab.next()).toMatchObject({
      type: "duel-found",
      opponent: { handle: "grace" },
    });
  });

  test("every tab of both is told; the Duel is played on the tab that accepted", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const adaOtherTab = await tab(ada);
    const alanTab = await tab(alan);
    const alanOtherTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab, adaOtherTab], alan, [alanTab, alanOtherTab]);

    // A new tab is told the Challenges waiting.
    const alanThirdTab = await tab(alan, {
      received: [{ id: challengeId, from: profile(ada), expiresAt: NOW + CHALLENGE_MS }],
    });

    await tab(ada, {
      sent: { id: challengeId, to: profile(alan), expiresAt: NOW + CHALLENGE_MS },
    });

    alanOtherTab.send({ type: "accept-challenge", challengeId });

    const told = await Promise.all(
      [adaTab, adaOtherTab, alanTab, alanOtherTab, alanThirdTab].map(async (client) =>
        client.nextChallenge(),
      ),
    );

    expect(told).toEqual(Array.from({ length: 5 }, () => ended(challengeId, "accepted")));

    expect(await alanOtherTab.next()).toMatchObject({ type: "duel-found" });
    expect(await alanTab.next()).toEqual({ type: "elsewhere", place: "duel" });
    expect(await adaTab.next()).toMatchObject({ type: "duel-found" });
    expect(await adaOtherTab.next()).toEqual({ type: "elsewhere", place: "duel" });
  });

  test("a Challenge ends once the friendship does", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    await call(alan.cookie, "DELETE", `/friends/${ada.id}`);
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "unavailable"));
    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "unavailable"));
  });

  test("a friendship removed while the Challenge is being sent: it is refused", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const held = Promise.withResolvers<void>();
    const released = Promise.withResolvers<void>();

    // The Challenge's read of the friendship is done, not yet answered.
    holding = { held: held.resolve, released: released.promise };
    adaTab.send({ type: "send-challenge", userId: alan.id });
    await held.promise;
    await call(alan.cookie, "DELETE", `/friends/${ada.id}`);
    released.resolve();

    expect(await adaTab.nextChallenge()).toEqual({
      type: "challenge-refused",
      userId: alan.id,
      reason: "not-friends",
    });
    await alanTab.settleChallenges();
  });

  test("the sender cannot cancel a Challenge once accepted", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);
    const held = Promise.withResolvers<void>();
    const released = Promise.withResolvers<void>();

    // Accepted, the Duel being set up.
    holding = { held: held.resolve, released: released.promise };
    alanTab.send({ type: "accept-challenge", challengeId });
    await held.promise;
    adaTab.send({ type: "cancel-challenge", challengeId });
    await adaTab.settleChallenges();
    released.resolve();

    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "accepted"));
    expect(await adaTab.next()).toMatchObject({ type: "duel-found" });
  });

  test("a Challenge ends once either has no tab left, not before", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const adaOtherTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab, adaOtherTab], alan, [alanTab]);

    // The tab that sent it closes: the Duel will be played on the other one.
    await closed(adaTab);
    await alanTab.settleChallenges();

    await closed(adaOtherTab);
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "unavailable"));
  });

  test("the sender's tab closed, the Duel is played on another of theirs", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const adaOtherTab = await tab(ada);
    const alanTab = await tab(alan);
    const challengeId = await challenge(ada, [adaTab, adaOtherTab], alan, [alanTab]);

    await closed(adaTab);
    alanTab.send({ type: "accept-challenge", challengeId });
    expect(await adaOtherTab.nextChallenge()).toEqual(ended(challengeId, "accepted"));
    expect(await adaOtherTab.next()).toMatchObject({ type: "duel-found" });
  });

  test("a Challenge ends once either enters a Duel from the Queue", async () => {
    const ada = await newUser("Ada");
    const alan = await newUser("Alan");
    const grace = await newUser("Grace");

    await befriend(ada, alan);

    const adaTab = await tab(ada);
    const alanTab = await tab(alan);
    const graceTab = await tab(grace);
    const challengeId = await challenge(ada, [adaTab], alan, [alanTab]);

    await paired(alanTab, graceTab);
    expect(await alanTab.nextChallenge()).toEqual(ended(challengeId, "unavailable"));
    expect(await adaTab.nextChallenge()).toEqual(ended(challengeId, "unavailable"));
  });
});
