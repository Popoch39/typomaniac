import { expect } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { testUtils } from "better-auth/plugins";
import pino from "pino";
import { byStanding, type OrnamentChoice, type Rating } from "ranked";
import { currentWordListVersion, defaultPace } from "typing-engine";

import type { AppConfig } from "./app";
import { type Clock, systemClock } from "./lib/clock";
import type { AuthHandler } from "./modules/auth";
import { authOptions } from "./modules/auth/service";
import { type ActivityMessage, ActivityModel, type ArrivalMessage } from "./modules/activity/model";
import { type ChallengeMessage, ChallengeModel } from "./modules/challenge/model";
import {
  type ClientMessage,
  DuelModel,
  type DuelOutcome,
  type QueueStatus,
  type ServerMessage,
} from "./modules/duel/model";
import type {
  DuelCursor,
  DuelHistoryPlayer,
  DuelPlayerRecord,
  DuelRecord,
  DuelStore,
  LeaderboardRow,
} from "./modules/duel/store";
import { type FriendMessage, FriendLiveModel, type Relation } from "./modules/friend/model";
import { type Friendship, type FriendStore, orderedPair } from "./modules/friend/store";
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

const historyPlayer = ({ userId, result, score }: DuelPlayerRecord): DuelHistoryPlayer => ({
  userId,
  wpm: result.wpm,
  score: score === null ? null : score.score,
});

// Most recent first, by end then by id, the way Postgres orders the Duel history.
const byNewestDuel = (a: DuelCursor, b: DuelCursor) => {
  if (a.endedAt !== b.endedAt) {
    return b.endedAt - a.endedAt;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id < b.id ? 1 : -1;
};

const average = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

const best = (values: number[]) => (values.length === 0 ? null : Math.max(...values));

// The finished Duels, kept in `saved` in the order they were written: a test can write past Duels
// there too. `deleteUser` does what the cascade does in Postgres: that User's player rows go, and
// they are no longer anyone's winner.
export const memoryDuelStore = () => {
  const saved: DuelRecord[] = [];
  const deleted = new Set<string>();
  // Each User's Rating, by id: a test can give one before the User joins the Queue.
  const ratings = new Map<string, Rating>();
  // Each User's Ornament choice, by id: "follow" when absent, as the column's default.
  const ornaments = new Map<string, OrnamentChoice>();

  const playersOf = (record: DuelRecord) =>
    record.players.filter((player) => !deleted.has(player.userId));

  const winnerOf = ({ winnerId }: DuelRecord) =>
    winnerId === null || deleted.has(winnerId) ? null : winnerId;

  const progression: DuelStore["progression"] = async (userId, limit) => {
    const points = saved
      .filter((record) => record.outcome !== "forfeit")
      .toSorted((a, b) => a.endedAt - b.endedAt)
      .flatMap((record) =>
        playersOf(record).flatMap(({ userId: playerId, result }) =>
          playerId === userId
            ? [
                {
                  endedAt: record.endedAt,
                  wpm: result.wpm,
                  raw: result.raw,
                  accuracy: result.accuracy,
                  consistency: result.consistency,
                },
              ]
            : [],
        ),
      );

    return limit === null ? points : points.slice(-limit);
  };

  // The Users past Placement in the Classement's order, as the Drizzle store sorts them.
  const classement = (): LeaderboardRow[] =>
    [...ratings]
      .flatMap(([userId, { rank }]) =>
        "placementsLeft" in rank || deleted.has(userId) ? [] : [{ userId, standing: rank }],
      )
      .toSorted(
        (a, b) =>
          byStanding(a.standing, b.standing) ||
          (a.userId < b.userId ? -1 : Number(a.userId > b.userId)),
      )
      .map(({ userId, standing }, index) => ({ userId, position: index + 1, standing }));

  const store: DuelStore = {
    progression,
    recentDuelsOf: async (userIds, limit) =>
      saved
        .toSorted(byNewestDuel)
        .flatMap((record) => {
          const players = playersOf(record);

          if (!players.some((player) => userIds.includes(player.userId))) {
            return [];
          }

          return [
            {
              id: record.id,
              endedAt: record.endedAt,
              outcome: record.outcome,
              winnerId: winnerOf(record),
              players: players.map(({ userId, result }) => ({ userId, wpm: result.wpm })),
            },
          ];
        })
        .slice(0, limit),
    save: async (record) => {
      saved.push(record);

      for (const { userId, rated } of record.players) {
        if (rated) {
          ratings.set(userId, rated.after);
        }
      }
    },
    ensureRating: async (userId, initial) => {
      const rating = ratings.get(userId) ?? initial;

      ratings.set(userId, rating);

      return rating;
    },
    rankOf: async (userId) => ratings.get(userId)?.rank ?? null,
    ornamentChoiceOf: async (userId) => ornaments.get(userId) ?? "follow",
    leaderboard: async (limit) => classement().slice(0, limit),
    leaderboardPosition: async (userId) =>
      classement().find((row) => row.userId === userId)?.position ?? null,
    recentWpms: async (userId, count) =>
      saved
        .toSorted((a, b) => b.endedAt - a.endedAt)
        .flatMap((record) => playersOf(record).filter((player) => player.userId === userId))
        .slice(0, count)
        .map((player) => player.result.wpm),
    // Ranked as the Drizzle store writes it: both players rated.
    recentRankedDuels: async (userId, count) =>
      saved
        .toSorted(byNewestDuel)
        .flatMap((record) => {
          const player = playersOf(record).find((candidate) => candidate.userId === userId);

          return player && record.players.every(({ rated }) => rated !== null)
            ? [{ outcome: record.outcome, winnerId: winnerOf(record), wpm: player.result.wpm }]
            : [];
        })
        .slice(0, count),
    history: async (userId, { before, limit }) =>
      saved
        .filter((record) => before === null || byNewestDuel(before, record) < 0)
        .toSorted(byNewestDuel)
        .flatMap((record) => {
          const players = playersOf(record);
          const player = players.find((candidate) => candidate.userId === userId);

          if (!player) {
            return [];
          }

          const opponent = players.find((candidate) => candidate.userId !== userId);

          return [
            {
              id: record.id,
              endedAt: record.endedAt,
              outcome: record.outcome,
              winnerId: winnerOf(record),
              player: historyPlayer(player),
              opponent: opponent ? historyPlayer(opponent) : null,
              tp: player.rated?.tp ?? null,
            },
          ];
        })
        .slice(0, limit),
    playedDuel: async (userId, duelId) => {
      const record = saved.find((candidate) => candidate.id === duelId);

      if (!record) {
        return null;
      }

      const players = playersOf(record);
      const player = players.find((candidate) => candidate.userId === userId);

      if (!player) {
        return null;
      }

      const { players: _, ...duel } = record;

      return {
        ...duel,
        winnerId: winnerOf(record),
        player,
        opponent: players.find((candidate) => candidate.userId !== userId) ?? null,
      };
    },
    stats: async (userId) => {
      const played = saved.flatMap((record) => {
        const player = playersOf(record).find((candidate) => candidate.userId === userId);

        return player ? [{ record, player }] : [];
      });

      const wins = played.filter(({ record }) => winnerOf(record) === userId).length;
      const draws = played.filter(({ record }) => record.outcome === "draw").length;
      const wpms = played.map(({ player }) => player.result.wpm);

      const scores = played.flatMap(({ player }) => (player.score ? [player.score] : []));

      return {
        duels: played.length,
        record: { wins, losses: played.length - wins - draws, draws },
        averages: {
          wpm: average(wpms),
          accuracy: average(played.map(({ player }) => player.result.accuracy)),
        },
        records: {
          wpm: best(wpms),
          score: best(scores.map((score) => score.score)),
          combo: best(scores.map((score) => score.bestCombo)),
        },
      };
    },
  };

  const deleteUser = (userId: string) => {
    deleted.add(userId);
  };

  return { store, saved, ratings, ornaments, deleteUser };
};

// The Friend requests and the friendships in memory, in the order they were written. `now` dates
// each friendship: a test may pass its own to order them.
export const memoryFriendStore = ({ now = Date.now } = {}): FriendStore => {
  // Oldest first: read backwards for the newest first.
  let requests: { senderId: string; recipientId: string }[] = [];
  let friendships: Friendship[] = [];

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
        friendships = [
          ...friendships,
          { pair: orderedPair(senderId, recipientId), createdAt: now() },
        ];
      }

      return true;
    },
    deleteFriendship: async (userId, otherId) => {
      const [a, b] = orderedPair(userId, otherId);
      const before = friendships.length;

      friendships = friendships.filter(({ pair }) => pair[0] !== a || pair[1] !== b);

      return friendships.length < before;
    },
    // The newest first: the last written first among those of the same instant.
    recentFriendshipsOf: async (userIds, limit) =>
      friendships
        .toReversed()
        .filter(({ pair: [a, b] }) => userIds.includes(a) || userIds.includes(b))
        .toSorted((x, y) => y.createdAt - x.createdAt)
        .slice(0, limit),
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
    rated: null,
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

const RANKED_WINNERS = { win: "self", loss: "other", draw: null } as const;

// A ranked Duel of the Queue that `userId` finished at `wpm` at `endedAt`, won, lost or drawn by
// them: both players rated, in Placement.
export const rankedPastDuel = (
  userId: string,
  wpm: number,
  endedAt: number,
  outcome: DuelOutcome,
): DuelRecord => {
  const past = pastDuel(userId, wpm, endedAt);
  const [self, other] = past.players;
  const placement: Rating = { mmr: 1000, rank: { placementsLeft: 5 } };
  const rated = { before: placement, after: placement, tp: null };
  const winner = RANKED_WINNERS[outcome];

  return {
    ...past,
    outcome: winner === null ? "draw" : "win",
    winnerId: winner === null ? null : { self, other }[winner].userId,
    players: [
      { ...self, rated },
      { ...other, rated },
    ],
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

const challengeMessage = TypeCompiler.Compile(ChallengeModel.challengeMessage);

const activityMessage = TypeCompiler.Compile(ActivityModel.activityMessage);

const arrivalMessage = TypeCompiler.Compile(ActivityModel.arrivalMessage);

const queueStatus = TypeCompiler.Compile(DuelModel.queueStatus);

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
// is told of its Friends goes apart, read with nextFriends(), of its Challenges, read with
// nextChallenge(), of the Activity, read with nextActivity(), and of the Friends' arrivals, read
// with nextArrival(), and the Queue's status, read with nextQueueStatus(): the Queue and the Duel
// are read without them.
export const openClient = (url: string, cookie?: string) => {
  const socket = new WebSocket(url, { headers: cookie ? { cookie } : {} });
  const place = mailbox<ServerMessage>();
  const friends = mailbox<FriendMessage>();
  const challenges = mailbox<ChallengeMessage>();
  const activities = mailbox<ActivityMessage>();
  const arrivals = mailbox<ArrivalMessage>();
  const statuses = mailbox<QueueStatus>();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));

    if (!serverMessage.Check(message)) {
      throw new Error(`Not a server message: ${String(event.data)}`);
    }

    if (friendMessage.Check(message)) {
      friends.put(message);
    } else if (challengeMessage.Check(message)) {
      challenges.put(message);
    } else if (activityMessage.Check(message)) {
      activities.put(message);
    } else if (arrivalMessage.Check(message)) {
      arrivals.put(message);
    } else if (queueStatus.Check(message)) {
      statuses.put(message);
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

  // The same, of the Challenges too.
  const settleChallenges = async () => {
    await settle();
    expect(challenges.inbox).toEqual([]);
  };

  // The same, of the Activity too.
  const settleActivity = async () => {
    await settle();
    expect(activities.inbox).toEqual([]);
  };

  // The same, of the Friends' arrivals too.
  const settleArrivals = async () => {
    await settle();
    expect(arrivals.inbox).toEqual([]);
  };

  return {
    socket,
    opened,
    closed,
    next: place.next,
    nextFriends: friends.next,
    nextChallenge: challenges.next,
    nextActivity: activities.next,
    nextArrival: arrivals.next,
    nextQueueStatus: statuses.next,
    // Every Queue status received so far, the oldest first, taken out.
    queueStatuses: () => statuses.inbox.splice(0),
    send,
    settle,
    settleFriends,
    settleChallenges,
    settleActivity,
    settleArrivals,
  };
};

export type TestClient = ReturnType<typeof openClient>;

// The two Users just paired by the Queue both accept their Match proposal, `first` then
// `second`: the Duel found of each, once told the proposal ended.
export const acceptBoth = async (first: TestClient, second: TestClient) => {
  const [firstProposed, secondProposed] = await Promise.all([first.next(), second.next()]);

  expect(firstProposed).toMatchObject({ type: "match-proposed" });
  expect(secondProposed).toMatchObject({ type: "match-proposed" });
  first.send({ type: "accept-proposal" });
  expect(await second.next()).toEqual({ type: "opponent-accepted" });
  second.send({ type: "accept-proposal" });
  expect(await first.next()).toEqual({ type: "proposal-ended", reason: "accepted" });
  expect(await second.next()).toEqual({ type: "proposal-ended", reason: "accepted" });

  return Promise.all([first.next(), second.next()]);
};

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
