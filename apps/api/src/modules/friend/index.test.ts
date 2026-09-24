import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

import { createApp } from "../../app";
import type { RateLimit } from "../../plugins/rate-limit";
import { createTestAuth, memoryFriendStore, signIn, testConfig } from "../../test-app";

type Method = "GET" | "POST" | "DELETE";

const relationsFound = TypeCompiler.Compile(
  t.Array(t.Object({ handle: t.String(), relation: t.String() })),
);

type SendBody = { userId: string };

// A fresh app per test: its Users, its Friends and its counters are its own.
const setup = ({
  friendRequestRateLimit = { max: 1000, windowMs: 60_000 },
}: { friendRequestRateLimit?: RateLimit } = {}) => {
  const auth = createTestAuth();

  const app = createApp(
    testConfig({ auth, friendStore: memoryFriendStore(), friendRequestRateLimit }),
  );

  let users = 0;

  const call = async (cookie: string | null, method: Method, path: string, body?: SendBody) => {
    const headers = new Headers();

    if (cookie !== null) {
      headers.set("cookie", cookie);
    }

    if (body !== undefined) {
      headers.set("content-type", "application/json");
    }

    return app.handle(
      new Request(`http://localhost/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  };

  const json = async (cookie: string, path: string) => {
    const response = await call(cookie, "GET", path);

    expect(response.status).toBe(200);

    return response.json();
  };

  const newUser = async (handle?: string) => {
    users += 1;

    const image = `https://example.com/${users}.png`;

    const { user, cookie } = await signIn(auth, {
      name: `User ${users}`,
      email: `user-${users}@example.com`,
      image,
      handle,
    });

    const { id } = user;

    return {
      id,
      cookie,
      profile: { id, handle, image },
      send: (to: string) => call(cookie, "POST", "/friend-requests", { userId: to }),
      cancel: (to: string) => call(cookie, "DELETE", `/friend-requests/sent/${to}`),
      accept: (from: string) => call(cookie, "POST", `/friend-requests/received/${from}/accept`),
      decline: (from: string) => call(cookie, "DELETE", `/friend-requests/received/${from}`),
      remove: (friend: string) => call(cookie, "DELETE", `/friends/${friend}`),
      friends: () => json(cookie, "/friends"),
      requests: () => json(cookie, "/friend-requests"),
      search: (prefix: string) => json(cookie, `/users/search?handle=${prefix}`),
    };
  };

  // `count` Users with a Handle, opened side by side.
  const newUsers = async (count: number, prefix: string) =>
    Promise.all(Array.from({ length: count }, (_, index) => newUser(`${prefix}_${index}`)));

  return { newUser, newUsers, call };
};

type TestUser = Awaited<ReturnType<ReturnType<typeof setup>["newUser"]>>;

// Friends in two steps: a Friend request, accepted.
const befriend = async (a: TestUser, b: TestUser) => {
  expect((await a.send(b.id)).status).toBe(200);
  expect((await b.accept(a.id)).status).toBe(200);
};

// `user` gets a Friend request from each of `others` and accepts them all.
const befriendAll = async (user: TestUser, others: TestUser[]) => {
  await Promise.all(others.map(async (other) => other.send(user.id)));

  const accepted = await Promise.all(others.map(async (other) => user.accept(other.id)));

  expect(accepted.every((response) => response.status === 200)).toBe(true);
};

// A refused action: its status and the rule it broke, in the error's details.
const expectRefused = async (response: Response, status: number, reason: string) => {
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    error: { details: [{ path: "/userId", message: reason }] },
  });
};

describe("friends", () => {
  test("need a Session", async () => {
    const { call } = setup();

    const responses = await Promise.all([
      call(null, "GET", "/friends"),
      call(null, "GET", "/friend-requests"),
      call(null, "POST", "/friend-requests", { userId: "someone" }),
      call(null, "DELETE", "/friend-requests/sent/someone"),
      call(null, "POST", "/friend-requests/received/someone/accept"),
      call(null, "DELETE", "/friend-requests/received/someone"),
      call(null, "DELETE", "/friends/someone"),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401, 401, 401, 401, 401,
    ]);
  });

  test("need a Handle", async () => {
    const { newUser, call } = setup();
    const visitor = await newUser();
    const ada = await newUser("ada");

    const responses = await Promise.all([
      call(visitor.cookie, "GET", "/friends"),
      call(visitor.cookie, "GET", "/friend-requests"),
      visitor.send(ada.id),
      visitor.cancel(ada.id),
      visitor.accept(ada.id),
      visitor.decline(ada.id),
      visitor.remove(ada.id),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403, 403, 403, 403, 403,
    ]);
  });

  test("start empty", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");

    expect(await ada.friends()).toEqual([]);
    expect(await ada.requests()).toEqual({ received: [], sent: [] });
  });
});

describe("sending a Friend request", () => {
  test("shows it to both Users, with the Handle and the avatar of the other", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    const response = await ada.send(bob.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ relation: "request-sent" });
    expect(await ada.requests()).toEqual({ received: [], sent: [bob.profile] });
    expect(await bob.requests()).toEqual({ received: [ada.profile], sent: [] });
  });

  test("never to oneself", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");

    await expectRefused(await ada.send(ada.id), 422, "self");
  });

  test("never to a User who does not exist or has no Handle", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const visitor = await newUser();

    await expectRefused(await ada.send("nobody"), 404, "user-not-found");
    await expectRefused(await ada.send(visitor.id), 404, "user-not-found");
  });

  test("never twice to the same User", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await ada.send(bob.id);

    await expectRefused(await ada.send(bob.id), 409, "already-requested");
  });

  test("never to a Friend", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await befriend(ada, bob);

    await expectRefused(await ada.send(bob.id), 409, "already-friends");
    await expectRefused(await bob.send(ada.id), 409, "already-friends");
  });

  test("to a User who had sent one makes them Friends at once", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await ada.send(bob.id);

    const response = await bob.send(ada.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ relation: "friend" });
    expect(await ada.friends()).toEqual([bob.profile]);
    expect(await bob.friends()).toEqual([ada.profile]);
    expect(await ada.requests()).toEqual({ received: [], sent: [] });
    expect(await bob.requests()).toEqual({ received: [], sent: [] });
  });

  test("crossing another at the same moment makes them Friends too", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    const responses = await Promise.all([ada.send(bob.id), bob.send(ada.id)]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await ada.friends()).toEqual([bob.profile]);
    expect(await ada.requests()).toEqual({ received: [], sent: [] });
    expect(await bob.requests()).toEqual({ received: [], sent: [] });
  });

  test("is limited per User", async () => {
    const { newUser } = setup({ friendRequestRateLimit: { max: 2, windowMs: 60_000 } });

    const ada = await newUser("ada");
    const bob = await newUser("bob");
    const one = await newUser("one");
    const two = await newUser("two");
    const three = await newUser("three");

    expect((await ada.send(one.id)).status).toBe(200);
    expect((await ada.send(two.id)).status).toBe(200);

    const limited = await ada.send(three.id);

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).not.toBeNull();
    expect(await limited.json()).toMatchObject({ error: { code: "TOO_MANY_REQUESTS" } });
    expect((await bob.send(three.id)).status).toBe(200);
  });
});

describe("the limits", () => {
  test("at most 50 Friend requests sent and waiting", async () => {
    const { newUser, newUsers } = setup();
    const ada = await newUser("ada");
    const first = await newUser("first");
    const others = await newUsers(49, "other");
    const last = await newUser("last");

    const sent = await Promise.all([first, ...others].map(async (other) => ada.send(other.id)));

    expect(sent.every((response) => response.status === 200)).toBe(true);

    await expectRefused(await ada.send(last.id), 409, "request-limit");

    // Once one is no longer waiting, there is room again.
    await ada.cancel(first.id);

    expect((await ada.send(last.id)).status).toBe(200);
  });

  test("at most 200 Friends", async () => {
    const { newUser, newUsers } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");
    const carl = await newUser("carl");

    await befriendAll(ada, await newUsers(200, "friend"));

    await expectRefused(await ada.send(bob.id), 409, "friend-limit");

    // Receiving a Friend request is still possible, not accepting it, even by a crossed one.
    expect((await carl.send(ada.id)).status).toBe(200);
    await expectRefused(await ada.accept(carl.id), 409, "friend-limit");
    await expectRefused(await ada.send(carl.id), 409, "friend-limit");
  });

  test("never past the other User's 200 Friends", async () => {
    const { newUser, newUsers } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await bob.send(ada.id);
    await befriendAll(bob, await newUsers(200, "friend"));

    await expectRefused(await ada.accept(bob.id), 409, "their-friend-limit");
    await expectRefused(await ada.send(bob.id), 409, "their-friend-limit");
  });
});

describe("answering a Friend request", () => {
  test("accepting makes both Users Friends and removes the request", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await ada.send(bob.id);

    const response = await bob.accept(ada.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ relation: "friend" });
    expect(await ada.friends()).toEqual([bob.profile]);
    expect(await bob.friends()).toEqual([ada.profile]);
    expect(await ada.requests()).toEqual({ received: [], sent: [] });
    expect(await bob.requests()).toEqual({ received: [], sent: [] });
  });

  test("declining removes it silently: the sender may ask again", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await ada.send(bob.id);

    const response = await bob.decline(ada.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ relation: "none" });
    expect(await bob.requests()).toEqual({ received: [], sent: [] });
    expect(await ada.requests()).toEqual({ received: [], sent: [] });
    expect(await ada.friends()).toEqual([]);
    expect((await ada.send(bob.id)).status).toBe(200);
  });

  test("cancelling removes it for both", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await ada.send(bob.id);

    const response = await ada.cancel(bob.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ relation: "none" });
    expect(await ada.requests()).toEqual({ received: [], sent: [] });
    expect(await bob.requests()).toEqual({ received: [], sent: [] });
  });

  test("needs a request, the right way round", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await ada.send(bob.id);

    await expectRefused(await ada.accept(bob.id), 404, "request-not-found");
    await expectRefused(await ada.decline(bob.id), 404, "request-not-found");
    await expectRefused(await bob.cancel(ada.id), 404, "request-not-found");
  });

  test("lists the requests newest first", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");
    const carl = await newUser("carl");
    const dora = await newUser("dora");
    const eve = await newUser("eve");

    await bob.send(ada.id);
    await carl.send(ada.id);
    await ada.send(dora.id);
    await ada.send(eve.id);

    expect(await ada.requests()).toEqual({
      received: [carl.profile, bob.profile],
      sent: [eve.profile, dora.profile],
    });
  });
});

describe("removing a Friend", () => {
  test("ends the friendship for both, without the other's say", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await befriend(ada, bob);

    const response = await bob.remove(ada.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ relation: "none" });
    expect(await ada.friends()).toEqual([]);
    expect(await bob.friends()).toEqual([]);
    expect((await ada.send(bob.id)).status).toBe(200);
  });

  test("needs a Friend", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const bob = await newUser("bob");

    await expectRefused(await ada.remove(bob.id), 404, "not-friends");
  });

  test("lists the Friends by Handle", async () => {
    const { newUser } = setup();
    const ada = await newUser("ada");
    const zoe = await newUser("zoe");
    const bob = await newUser("bob");

    await befriend(zoe, ada);
    await befriend(ada, bob);

    expect(await ada.friends()).toEqual([bob.profile, zoe.profile]);
  });
});

describe("the search", () => {
  test("shows where the searcher stands with each User found", async () => {
    const { newUser } = setup();
    const me = await newUser("me_myself");
    const friend = await newUser("rel_friend");
    const sent = await newUser("rel_sent");
    const received = await newUser("rel_received");

    await newUser("rel_none");
    await befriend(me, friend);
    await me.send(sent.id);
    await received.send(me.id);

    const found = relationsFound.Decode(await me.search("rel"));

    expect(found.map(({ handle, relation }) => [handle, relation])).toEqual([
      ["rel_friend", "friend"],
      ["rel_none", "none"],
      ["rel_received", "request-received"],
      ["rel_sent", "request-sent"],
    ]);
  });
});
