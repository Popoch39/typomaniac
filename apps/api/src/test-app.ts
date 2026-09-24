import { expect } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { testUtils } from "better-auth/plugins";
import pino from "pino";
import { currentWordListVersion, defaultPace } from "typing-engine";

import type { AppConfig } from "./app";
import { type Clock, systemClock } from "./lib/clock";
import type { AuthHandler } from "./modules/auth";
import { authOptions } from "./modules/auth/service";
import { type ClientMessage, DuelModel, type ServerMessage } from "./modules/duel/model";
import type { DuelRecord, DuelStore } from "./modules/duel/store";
import { type FriendMessage, FriendLiveModel, type Relation } from "./modules/friend/model";
import { type FriendStore, orderedPair } from "./modules/friend/store";
import { authUsers, type HandleSearch, type UserRow } from "./modules/user/users";

// Shared by the test files: the app's config with in-memory dependencies.

export const FRONT_ORIGIN = "http://localhost:5173";

// A function: each instance gets its own rate limit counters.
export const testAuthOptions = ({ isProduction = false } = {}) =>
  authOptions({
    secret: "a-test-secret-of-at-least-thirty-two-chars",
    baseURL: "http://localhost",
    trustedOrigin: FRONT_ORIGIN,
    socialProviders: {},
    isProduction,
  });

// The production auth options on Better Auth's in-memory database, plus its test
// helpers to open Sessions without going through an OAuth provider.
export const createTestAuth = () => {
  const options = testAuthOptions();

  return betterAuth({
    ...options,
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    plugins: [...options.plugins, testUtils()],
  });
};

export type TestAuth = ReturnType<typeof createTestAuth>;

// A User with an open Session: the cookie a browser would hold after an OAuth callback. Without a
// Handle unless given one.
export const signIn = async (
  auth: TestAuth,
  profile: { name: string; email: string; image?: string; handle?: string },
) => {
  const { test: helpers } = await auth.$context;

  const user = await helpers.saveUser(helpers.createUser(profile));

  const login = await helpers.login({ userId: user.id });

  return { user, token: login.token, cookie: login.headers.get("cookie") ?? "" };
};

// A clock moved by hand: `set` moves it forward and runs, in order, the callbacks due by then.
export const manualClock = (start: number) => {
  let time = start;
  let timers: { at: number; callback: () => void }[] = [];

  const clock: Clock = {
    now: () => time,
    at: (at, callback) => {
      timers.push({ at, callback });
    },
  };

  const set = (to: number) => {
    time = to;

    const due = timers.filter((timer) => timer.at <= to).toSorted((a, b) => a.at - b.at);

    timers = timers.filter((timer) => timer.at > to);

    for (const timer of due) {
      timer.callback();
    }
  };

  return { clock, set };
};

// The finished Duels, kept in `saved` in the order they were written: a test can write past Duels
// there too.
export const memoryDuelStore = () => {
  const saved: DuelRecord[] = [];

  const store: DuelStore = {
    save: async (record) => {
      saved.push(record);
    },
    recentWpms: async (userId, count) =>
      saved
        .toSorted((a, b) => b.endedAt - a.endedAt)
        .flatMap((record) => record.players.filter((player) => player.userId === userId))
        .slice(0, count)
        .map((player) => player.result.wpm),
  };

  return { store, saved };
};

// The Friend requests and the friendships in memory, in the order they were written.
export const memoryFriendStore = (): FriendStore => {
  // Oldest first: read backwards for the newest first.
  let requests: { senderId: string; recipientId: string }[] = [];
  let friendships: { pair: [string, string] }[] = [];

  const isRequest = (senderId: string, recipientId: string) =>
    requests.some(
      (request) => request.senderId === senderId && request.recipientId === recipientId,
    );

  const friendsOf = (userId: string) =>
    friendships.flatMap(({ pair: [a, b] }) => {
      if (a === userId) {
        return [b];
      }

      return b === userId ? [a] : [];
    });

  const deleteRequest = (senderId: string, recipientId: string) => {
    const before = requests.length;

    requests = requests.filter(
      (request) => request.senderId !== senderId || request.recipientId !== recipientId,
    );

    return requests.length < before;
  };

  return {
    relationsWith: async (userId, otherIds) => {
      const friends = new Set(friendsOf(userId));
      const relations = new Map<string, Relation>();

      for (const otherId of otherIds) {
        if (friends.has(otherId)) {
          relations.set(otherId, "friend");
        } else if (isRequest(otherId, userId)) {
          relations.set(otherId, "request-received");
        } else if (isRequest(userId, otherId)) {
          relations.set(otherId, "request-sent");
        }
      }

      return relations;
    },
    friendIds: async (userId) => friendsOf(userId),
    requestsOf: async (userId) => {
      const newestFirst = requests.toReversed();

      return {
        received: newestFirst.flatMap((request) =>
          request.recipientId === userId ? [request.senderId] : [],
        ),
        sent: newestFirst.flatMap((request) =>
          request.senderId === userId ? [request.recipientId] : [],
        ),
      };
    },
    countFriends: async (userId) => friendsOf(userId).length,
    countSentRequests: async (userId) =>
      requests.filter((request) => request.senderId === userId).length,
    addRequest: async (senderId, recipientId) => {
      if (isRequest(recipientId, senderId)) {
        return "crossed";
      }

      if (isRequest(senderId, recipientId)) {
        return "exists";
      }

      requests = [...requests, { senderId, recipientId }];

      return "added";
    },
    deleteRequest: async (...pair) => deleteRequest(...pair),
    acceptRequest: async (senderId, recipientId) => {
      if (!deleteRequest(senderId, recipientId)) {
        return false;
      }

      if (!friendsOf(senderId).includes(recipientId)) {
        friendships = [...friendships, { pair: orderedPair(senderId, recipientId) }];
      }

      return true;
    },
    deleteFriendship: async (userId, otherId) => {
      const [a, b] = orderedPair(userId, otherId);
      const before = friendships.length;

      friendships = friendships.filter(({ pair }) => pair[0] !== a || pair[1] !== b);

      return friendships.length < before;
    },
  };
};

// A Duel `userId` finished at `endedAt`, typing at `wpm`, against a User who is not in the test:
// only its end and that wpm count for the Pace.
export const pastDuel = (userId: string, wpm: number, endedAt: number): DuelRecord => {
  const player = (id: string) => ({
    userId: id,
    result: {
      wpm,
      raw: wpm,
      accuracy: 100,
      consistency: 80,
      chars: { correct: wpm * 2.5, incorrect: 0, extra: 0, missed: 0 },
    },
    pace: defaultPace,
    score: { score: 0, bestCombo: 0, bursts: 0 },
    keystrokes: [],
  });

  return {
    id: crypto.randomUUID(),
    seed: 1,
    language: "en",
    wordListVersion: currentWordListVersion.en,
    seconds: 30,
    startsAt: endedAt - 30_000,
    mode: "time",
    endedAt,
    outcome: "draw",
    winnerId: null,
    players: [player(userId), player("someone-else")],
  };
};

// The Handle search on the memory adapter: every User read, then filtered and sorted here, the way
// Postgres does it with `COLLATE "C"` (code unit order).
const memoryHandleSearch =
  (auth: AuthHandler): HandleSearch =>
  async (prefix, { excluding, limit }) => {
    const { adapter } = await auth.$context;

    const rows = await adapter.findMany<UserRow>({ model: "user", limit: Number.MAX_SAFE_INTEGER });

    return rows
      .flatMap(({ id, handle, image }) =>
        handle && handle.startsWith(prefix) && id !== excluding
          ? [{ id, handle, image: image ?? null }]
          : [],
      )
      .toSorted((a, b) => (a.handle < b.handle ? -1 : 1))
      .slice(0, limit);
  };

// The Users on a test auth's database.
export const testUsers = (auth: AuthHandler) =>
  authUsers(auth, { searchHandles: memoryHandleSearch(auth) });

const serverMessage = TypeCompiler.Compile(DuelModel.serverMessage);

const friendMessage = TypeCompiler.Compile(FriendLiveModel.friendMessage);

// Messages read in the order they arrived, with next(): waits for the next one when none is there.
const mailbox = <T>() => {
  const inbox: T[] = [];
  const waiting: ((message: T) => void)[] = [];

  const put = (message: T) => {
    const resolve = waiting.shift();

    if (resolve) {
      resolve(message);
    } else {
      inbox.push(message);
    }
  };

  const next = () =>
    new Promise<T>((resolve) => {
      const message = inbox.shift();

      if (message) {
        resolve(message);
      } else {
        waiting.push(resolve);
      }
    });

  return { inbox, put, next };
};

// A browser tab on the Duel socket: every message it receives, read in order with next(). What it
// is told of its Friends goes apart, read with nextFriends(): the Queue and the Duel are read
// without it.
export const openClient = (url: string, cookie?: string) => {
  const socket = new WebSocket(url, { headers: cookie ? { cookie } : {} });
  const place = mailbox<ServerMessage>();
  const friends = mailbox<FriendMessage>();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));

    if (!serverMessage.Check(message)) {
      throw new Error(`Not a server message: ${String(event.data)}`);
    }

    if (friendMessage.Check(message)) {
      friends.put(message);
    } else {
      place.put(message);
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

  const send = (message: ClientMessage) => socket.send(JSON.stringify(message));

  // A round trip: the server answers a malformed message, so anything it sent before is
  // already received. Proves that nothing else is on its way, of the Queue and the Duel.
  const settle = async () => {
    socket.send("not a message");

    expect(await place.next()).toEqual({ type: "invalid-message" });
    expect(place.inbox).toEqual([]);
  };

  // The same, of the Friends too.
  const settleFriends = async () => {
    await settle();
    expect(friends.inbox).toEqual([]);
  };

  return {
    socket,
    opened,
    closed,
    next: place.next,
    nextFriends: friends.next,
    send,
    settle,
    settleFriends,
  };
};

export type TestClient = ReturnType<typeof openClient>;

// The Users are read from the auth's database: the one of `overrides.auth` when a test passes one.
export const testConfig = (overrides: Partial<AppConfig> = {}): AppConfig => {
  const auth = overrides.auth ?? createTestAuth();

  return {
    corsOrigin: FRONT_ORIGIN,
    isProduction: false,
    trustProxy: false,
    rateLimit: { max: 1000, windowMs: 60_000 },
    logger: pino({ level: "silent" }),
    auth,
    users: testUsers(auth),
    clock: systemClock,
    duelStore: memoryDuelStore().store,
    searchRateLimit: { max: 1000, windowMs: 60_000 },
    friendStore: memoryFriendStore(),
    friendRequestRateLimit: { max: 1000, windowMs: 60_000 },
    ...overrides,
  };
};
