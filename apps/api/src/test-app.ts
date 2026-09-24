import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { testUtils } from "better-auth/plugins";
import pino from "pino";
import { currentWordListVersion, defaultPace } from "typing-engine";

import type { AppConfig } from "./app";
import { authOptions } from "./auth";
import { type Clock, systemClock } from "./clock";
import type { DuelRecord, DuelStore } from "./duel/duel-store";
import type { AuthHandler } from "./plugins/authentication";
import { authUsers, type HandleSearch, type UserRow } from "./users";

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
    ...overrides,
  };
};
