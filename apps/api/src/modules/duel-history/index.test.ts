import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Rating } from "ranked";
import { currentWordListVersion, defaultPace, generateText, type Keystroke } from "typing-engine";

import { createApp } from "../../app";
import { createTestAuth, memoryDuelStore, signIn, testConfig, testUsers } from "../../test-app";
import type { DuelPlayerRecord, DuelRecord } from "../duel/store";
import { DuelHistoryModel } from "./model";

const historyWeek = TypeCompiler.Compile(DuelHistoryModel.week);

const historyActivity = TypeCompiler.Compile(DuelHistoryModel.activity);

// A week from the epoch: the Duels of these tests end in it unless they say otherwise.
const FIRST_WEEK = `?from=0&to=${7 * 24 * 3600 * 1000}`;

const replayedDuel = TypeCompiler.Compile(DuelHistoryModel.duel);

// `rated` for a Duel of the Queue: the TP it moved, null in Placement.
type Side = {
  userId: string;
  wpm: number;
  score: number | null;
  keystrokes?: Keystroke[];
  rated?: { tp: number | null };
};

const RATING: Rating = {
  mmr: 1000,
  rank: { tier: "gold", division: 2, tp: 40, shielded: false },
};

// A finished Duel between two Users: `outcome` and `winnerId` as the server wrote them.
const finishedDuel = ({
  id = crypto.randomUUID(),
  endedAt,
  lasted = 30_000,
  outcome = "win",
  winnerId = null,
  players: [first, second],
}: {
  id?: string;
  endedAt: number;
  // From its start to its end: shorter than its 30 s for a Forfeit.
  lasted?: number;
  outcome?: DuelRecord["outcome"];
  winnerId?: string | null;
  players: [Side, Side];
}): DuelRecord => {
  const player = ({ userId, wpm, score, keystrokes = [], rated }: Side): DuelPlayerRecord => ({
    userId,
    result: {
      wpm,
      raw: wpm,
      accuracy: 100,
      consistency: 80,
      chars: { correct: wpm * 2.5, incorrect: 0, extra: 0, missed: 0 },
    },
    pace: defaultPace,
    score: score === null ? null : { score, bestCombo: 10, bursts: 1 },
    keystrokes,
    rated: rated ? { before: RATING, after: RATING, tp: rated.tp } : null,
  });

  return {
    id,
    seed: 1,
    language: "en",
    wordListVersion: currentWordListVersion.en,
    seconds: 30,
    startsAt: endedAt - lasted,
    mode: "time",
    endedAt,
    outcome,
    winnerId,
    players: [player(first), player(second)],
  };
};

// A fresh app per test: its Users and its Duels are its own.
const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const app = createApp(testConfig({ auth, duelStore: duels.store }));

  let users = 0;

  // `path` under `/api/duels`, its query included.
  const history = (cookie: string | null, path = FIRST_WEEK) =>
    app.handle(
      new Request(`http://localhost/api/duels${path}`, {
        headers: cookie === null ? undefined : { cookie },
      }),
    );

  const newUser = async (handle: string) => {
    users += 1;

    const image = `https://example.com/${users}.png`;

    const { user, cookie } = await signIn(auth, {
      name: `User ${users}`,
      email: `user-${users}@example.com`,
      image,
      handle,
    });

    // Their Duels of a week, the first one from the epoch unless `query` says otherwise.
    const week = async (query = FIRST_WEEK) => {
      const response = await history(cookie, query);

      expect(response.status).toBe(200);

      const body = await response.json();

      if (!historyWeek.Check(body)) {
        throw new Error(`Not a week of the Duel history: ${JSON.stringify(body)}`);
      }

      return body;
    };

    // Their Activity, `query` given whole.
    const activity = async (query: string) => {
      const response = await history(cookie, `/activity${query}`);

      expect(response.status).toBe(200);

      const body = await response.json();

      if (!historyActivity.Check(body)) {
        throw new Error(`Not an Activity: ${JSON.stringify(body)}`);
      }

      return body;
    };

    // Their Duel `duelId`, to replay it.
    const replay = async (duelId: string) => {
      const response = await duelResponse(cookie, duelId);

      expect(response.status).toBe(200);

      const body = await response.json();

      if (!replayedDuel.Check(body)) {
        throw new Error(`Not a replayed Duel: ${JSON.stringify(body)}`);
      }

      return body;
    };

    return { id: user.id, image, cookie, week, activity, replay };
  };

  const duelResponse = (cookie: string | null, duelId: string) =>
    app.handle(
      new Request(`http://localhost/api/duels/${duelId}`, {
        headers: cookie === null ? undefined : { cookie },
      }),
    );

  return { auth, duels, history, duelResponse, newUser };
};

describe("GET /api/duels", () => {
  test("lists a User's finished Duel, seen from them", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        id: "duel-1",
        endedAt: 1_000_000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200 },
          { userId: alan.id, wpm: 70, score: 800 },
        ],
      }),
    );

    expect(await ada.week()).toEqual({
      duels: [
        {
          id: "duel-1",
          endedAt: 1_000_000,
          opponent: { handle: "alan", image: alan.image },
          outcome: "win",
          forfeit: false,
          score: 1200,
          opponentScore: 800,
          wpm: 90,
          opponentWpm: 70,
          tp: null,
          ranked: false,
          // Neither typed: 30 seconds at 0 wpm.
          wpmBySecond: Array.from({ length: 30 }, () => 0),
          opponentWpmBySecond: Array.from({ length: 30 }, () => 0),
        },
      ],
    });
  });

  test("each side's wpm of each second, replayed from their Keystrokes, up to the Forfeit", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    // Ada types her Text at 100 ms a character; Alan at 200 ms, until he forfeits at 10 s.
    const text = generateText(1, "en", currentWordListVersion.en, 100).join(" ");

    const typing = (every: number, until: number) =>
      [...text]
        .slice(0, Math.floor(until / every))
        .map((char, index): Keystroke => ({ kind: "char", char, at: (index + 1) * every }));

    duels.saved.push(
      finishedDuel({
        id: "full",
        endedAt: 1_000_000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, keystrokes: typing(100, 30_000) },
          { userId: alan.id, wpm: 50, score: 400, keystrokes: typing(200, 30_000) },
        ],
      }),
      finishedDuel({
        id: "forfeited",
        lasted: 10_000,
        endedAt: 2_000_000,
        outcome: "forfeit",
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, keystrokes: typing(100, 10_000) },
          { userId: alan.id, wpm: 50, score: 400, keystrokes: typing(200, 10_000) },
        ],
      }),
    );

    const [forfeited, full] = (await ada.week()).duels;

    expect(full?.wpmBySecond).toHaveLength(30);
    expect(full?.wpmBySecond.at(-1)).toBeGreaterThan(full?.opponentWpmBySecond?.at(-1) ?? 0);
    expect(forfeited?.wpmBySecond).toHaveLength(10);
    expect(forfeited?.opponentWpmBySecond).toHaveLength(10);
  });

  test("a ranked Duel shows the TP it moved for the reader, not for a Challenge nor in Placement", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        id: "ranked",
        endedAt: 3000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, rated: { tp: 18 } },
          { userId: alan.id, wpm: 70, score: 800, rated: { tp: -15 } },
        ],
      }),
      finishedDuel({
        id: "placement",
        endedAt: 2000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, rated: { tp: null } },
          { userId: alan.id, wpm: 70, score: 800, rated: { tp: -12 } },
        ],
      }),
      finishedDuel({
        id: "challenge",
        endedAt: 1000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200 },
          { userId: alan.id, wpm: 70, score: 800 },
        ],
      }),
    );

    const tps = async (user: typeof ada) =>
      (await user.week()).duels.map(({ id, tp }) => ({ id, tp }));

    expect(await tps(ada)).toEqual([
      { id: "ranked", tp: 18 },
      { id: "placement", tp: null },
      { id: "challenge", tp: null },
    ]);
    expect(await tps(alan)).toEqual([
      { id: "ranked", tp: -15 },
      { id: "placement", tp: -12 },
      { id: "challenge", tp: null },
    ]);
  });

  test("a Duel says whether it was Ranked, Placement included, and a Challenge is not", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        id: "ranked",
        endedAt: 3000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, rated: { tp: 18 } },
          { userId: alan.id, wpm: 70, score: 800, rated: { tp: -15 } },
        ],
      }),
      finishedDuel({
        id: "placement",
        endedAt: 2000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, rated: { tp: null } },
          { userId: alan.id, wpm: 70, score: 800, rated: { tp: null } },
        ],
      }),
      finishedDuel({
        id: "challenge",
        endedAt: 1000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200 },
          { userId: alan.id, wpm: 70, score: 800 },
        ],
      }),
    );

    const kinds = async (user: typeof ada) =>
      (await user.week()).duels.map(({ id, ranked }) => ({ id, ranked }));

    const expected = [
      { id: "ranked", ranked: true },
      { id: "placement", ranked: true },
      { id: "challenge", ranked: false },
    ];

    expect(await kinds(ada)).toEqual(expected);
    expect(await kinds(alan)).toEqual(expected);
  });

  test("a Visitor gets 401", async () => {
    const { history } = setup();

    const response = await history(null);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  test("a User without any Duel gets an empty page", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");

    duels.saved.push(
      finishedDuel({
        endedAt: 1000,
        players: [
          { userId: alan.id, wpm: 90, score: 1 },
          { userId: grace.id, wpm: 70, score: 0 },
        ],
      }),
    );

    expect(await ada.week()).toEqual({ duels: [] });
  });

  test("only the Duels that ended in [from, to), the most recent first, then by id at the same end", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    const duelAt = (id: string, endedAt: number) =>
      finishedDuel({
        id,
        endedAt,
        outcome: "draw",
        players: [
          { userId: ada.id, wpm: 80, score: 10 },
          { userId: alan.id, wpm: 80, score: 10 },
        ],
      });

    duels.saved.push(
      duelAt("before", 99_999),
      duelAt("first", 100_000),
      duelAt("same-a", 150_000),
      duelAt("same-b", 150_000),
      duelAt("last", 199_999),
      duelAt("after", 200_000),
    );

    const ids = (await ada.week("?from=100000&to=200000")).duels.map(({ id }) => id);

    expect(ids).toEqual(["last", "same-b", "same-a", "first"]);
  });

  test.each([
    ["no range", ""],
    ["`to` before `from`", "?from=2000&to=1000"],
    ["an empty range", "?from=1000&to=1000"],
    ["more than a week and its hour", `?from=0&to=${8 * 24 * 3600 * 1000 + 1}`],
    ["a range that is not numbers", "?from=monday&to=sunday"],
  ])("refuses %s", async (_, query) => {
    const { newUser, history } = setup();
    const ada = await newUser("ada");

    const response = await history(ada.cookie, query);

    expect(response.status).toBe(422);
  });

  test("each User sees the outcome from their side", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    const players: [Side, Side] = [
      { userId: ada.id, wpm: 80, score: 900 },
      { userId: alan.id, wpm: 75, score: 700 },
    ];

    duels.saved.push(
      finishedDuel({ id: "won", endedAt: 3000, outcome: "win", winnerId: ada.id, players }),
      finishedDuel({ id: "drawn", endedAt: 2000, outcome: "draw", players }),
      finishedDuel({
        id: "forfeited",
        endedAt: 1000,
        outcome: "forfeit",
        winnerId: alan.id,
        players,
      }),
    );

    const seen = async (user: typeof ada) =>
      (await user.week()).duels.map(
        ({ id, outcome, forfeit }: { id: string; outcome: string; forfeit: boolean }) => ({
          id,
          outcome,
          forfeit,
        }),
      );

    expect(await seen(ada)).toEqual([
      { id: "won", outcome: "win", forfeit: false },
      { id: "drawn", outcome: "draw", forfeit: false },
      { id: "forfeited", outcome: "loss", forfeit: true },
    ]);
    expect(await seen(alan)).toEqual([
      { id: "won", outcome: "loss", forfeit: false },
      { id: "drawn", outcome: "draw", forfeit: false },
      { id: "forfeited", outcome: "win", forfeit: true },
    ]);
  });

  test("a Duel played before the Score has null Scores", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        endedAt: 1000,
        winnerId: alan.id,
        players: [
          { userId: ada.id, wpm: 60, score: null },
          { userId: alan.id, wpm: 90, score: null },
        ],
      }),
    );

    const [entry] = (await ada.week()).duels;

    expect(entry).toMatchObject({
      outcome: "loss",
      score: null,
      opponentScore: null,
      wpm: 60,
      opponentWpm: 90,
    });
  });

  test("a deleted opponent is null, the Duel stays", async () => {
    const { auth, duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        id: "duel-1",
        endedAt: 1000,
        winnerId: alan.id,
        players: [
          { userId: ada.id, wpm: 60, score: 500 },
          { userId: alan.id, wpm: 90, score: 900 },
        ],
      }),
    );

    await (await auth.$context).internalAdapter.deleteUser(alan.id);
    duels.deleteUser(alan.id);

    expect(await ada.week()).toEqual({
      duels: [
        {
          id: "duel-1",
          endedAt: 1000,
          opponent: null,
          outcome: "loss",
          forfeit: false,
          score: 500,
          tp: null,
          ranked: false,
          opponentScore: null,
          wpm: 60,
          opponentWpm: null,
          wpmBySecond: Array.from({ length: 30 }, () => 0),
          opponentWpmBySecond: null,
        },
      ],
    });
  });

  test("shows the opponent's Handle of today, never their name nor their email", async () => {
    const { auth, duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        endedAt: 1000,
        outcome: "draw",
        players: [
          { userId: ada.id, wpm: 60, score: 500 },
          { userId: alan.id, wpm: 60, score: 500 },
        ],
      }),
    );

    await testUsers(auth).setHandle(alan.id, "turing");

    const [entry] = (await ada.week()).duels;

    expect(entry?.opponent).toEqual({ handle: "turing", image: alan.image });
    expect(JSON.stringify(entry)).not.toContain("User 2");
    expect(JSON.stringify(entry)).not.toContain("@example.com");
  });
});

const at = (iso: string) => Date.parse(iso);

const range = (from: string, to: string, timeZone: string) =>
  `?from=${at(from)}&to=${at(to)}&timeZone=${encodeURIComponent(timeZone)}`;

// Ada's Duels against Alan at those instants, and one between Alan and Grace.
const withActivity = async (ends: string[]) => {
  const context = setup();
  const ada = await context.newUser("ada");
  const alan = await context.newUser("alan");
  const grace = await context.newUser("grace");

  context.duels.saved.push(
    ...ends.map((end) =>
      finishedDuel({
        endedAt: at(end),
        outcome: "draw",
        players: [
          { userId: ada.id, wpm: 80, score: 10 },
          { userId: alan.id, wpm: 80, score: 10 },
        ],
      }),
    ),
    finishedDuel({
      endedAt: at("2026-09-20T12:00:00Z"),
      outcome: "draw",
      players: [
        { userId: alan.id, wpm: 80, score: 10 },
        { userId: grace.id, wpm: 80, score: 10 },
      ],
    }),
  );

  return { ...context, ada };
};

describe("GET /api/duels/activity", () => {
  test("counts the User's Duels by day of their time zone, the oldest first, and says when the first ended", async () => {
    const { ada } = await withActivity([
      "2026-08-01T10:00:00Z",
      "2026-09-21T09:00:00Z",
      "2026-09-21T18:00:00Z",
      // 00:30 on the 29th in Paris, still the 28th in UTC.
      "2026-09-28T22:30:00Z",
    ]);

    const september = range("2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z", "Europe/Paris");

    expect(await ada.activity(september)).toEqual({
      days: [
        { day: "2026-09-21", duels: 2 },
        { day: "2026-09-29", duels: 1 },
      ],
      first: at("2026-08-01T10:00:00Z"),
    });

    expect(
      (await ada.activity(range("2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z", "UTC"))).days,
    ).toEqual([
      { day: "2026-09-21", duels: 2 },
      { day: "2026-09-28", duels: 1 },
    ]);
  });

  test("a User without any Duel has no day and no first Duel", async () => {
    const { ada } = await withActivity([]);

    expect(
      await ada.activity(range("2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z", "UTC")),
    ).toEqual({ days: [], first: null });
  });

  test.each([
    ["an unknown time zone", range("2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z", "Mars/Olympus")],
    ["no time zone", `?from=0&to=1000`],
    ["more than 120 days", range("2026-01-01T00:00:00Z", "2026-06-01T00:00:00Z", "UTC")],
    ["`to` before `from`", range("2026-10-01T00:00:00Z", "2026-09-01T00:00:00Z", "UTC")],
  ])("refuses %s", async (_, query) => {
    const { ada, history } = await withActivity([]);

    const response = await history(ada.cookie, `/activity${query}`);

    expect(response.status).toBe(422);
  });

  test("a Visitor gets 401", async () => {
    const { history } = setup();

    const response = await history(null, `/activity${range("2026-09-01", "2026-10-01", "UTC")}`);

    expect(response.status).toBe(401);
  });
});

// A side of a replayed Duel as `finishedDuel` writes it, without its Keystrokes.
const player = (image: string, handle: string, wpm: number, score: number) => ({
  handle,
  image,
  result: {
    wpm,
    raw: wpm,
    accuracy: 100,
    consistency: 80,
    chars: { correct: wpm * 2.5, incorrect: 0, extra: 0, missed: 0 },
  },
  pace: defaultPace,
  score: { score, bestCombo: 10, bursts: 1 },
});

describe("GET /api/duels/:duelId", () => {
  const adaTyped: Keystroke[] = [
    { kind: "char", char: "s", at: 120 },
    { kind: "char", char: "x", at: 250 },
    { kind: "backspace", at: 400 },
  ];

  const alanTyped: Keystroke[] = [
    { kind: "char", char: "s", at: 90 },
    { kind: "deleteWord", at: 300 },
  ];

  // A Duel Ada won against Alan, then one between two other Users.
  const withDuels = async () => {
    const context = setup();
    const ada = await context.newUser("ada");
    const alan = await context.newUser("alan");
    const grace = await context.newUser("grace");
    const linus = await context.newUser("linus");

    context.duels.saved.push(
      finishedDuel({
        id: "ada-alan",
        endedAt: 1_030_000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, keystrokes: adaTyped },
          { userId: alan.id, wpm: 70, score: 800, keystrokes: alanTyped },
        ],
      }),
      finishedDuel({
        id: "grace-linus",
        endedAt: 2_000_000,
        outcome: "draw",
        players: [
          { userId: grace.id, wpm: 60, score: null },
          { userId: linus.id, wpm: 60, score: null },
        ],
      }),
    );

    return { ...context, ada, alan, grace };
  };

  test("a player gets the whole Duel seen from them, both Users' Keystrokes included", async () => {
    const { ada, alan } = await withDuels();

    expect(await ada.replay("ada-alan")).toEqual({
      id: "ada-alan",
      seed: 1,
      language: "en",
      wordListVersion: currentWordListVersion.en,
      seconds: 30,
      startsAt: 1_000_000,
      endedAt: 1_030_000,
      outcome: "win",
      forfeit: false,
      ranked: false,
      tp: null,
      me: { ...player(ada.image, "ada", 90, 1200), keystrokes: adaTyped },
      opponent: { ...player(alan.image, "alan", 70, 800), keystrokes: alanTyped },
    });

    const fromAlan = await alan.replay("ada-alan");

    expect(fromAlan.outcome).toBe("loss");
    expect(fromAlan.me.keystrokes).toEqual(alanTyped);
    expect(fromAlan.opponent?.handle).toBe("ada");
    expect(fromAlan.opponent?.keystrokes).toEqual(adaTyped);
  });

  test("a Ranked Duel says so with the TP it moved for the reader, none in Placement nor for a Challenge", async () => {
    const { duels, ada, alan } = await withDuels();

    duels.saved.push(
      finishedDuel({
        id: "ranked",
        endedAt: 3000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, rated: { tp: 18 } },
          { userId: alan.id, wpm: 70, score: 800, rated: { tp: -15 } },
        ],
      }),
      finishedDuel({
        id: "placement",
        endedAt: 2000,
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: 1200, rated: { tp: null } },
          { userId: alan.id, wpm: 70, score: 800, rated: { tp: -12 } },
        ],
      }),
    );

    const kinds = async (user: typeof ada) =>
      Promise.all(
        ["ranked", "placement", "ada-alan"].map(async (duelId) => {
          const { id, ranked, tp } = await user.replay(duelId);

          return { id, ranked, tp };
        }),
      );

    expect(await kinds(ada)).toEqual([
      { id: "ranked", ranked: true, tp: 18 },
      { id: "placement", ranked: true, tp: null },
      { id: "ada-alan", ranked: false, tp: null },
    ]);
    expect(await kinds(alan)).toEqual([
      { id: "ranked", ranked: true, tp: -15 },
      { id: "placement", ranked: true, tp: -12 },
      { id: "ada-alan", ranked: false, tp: null },
    ]);
  });

  test("a Duel played before the Score has no Score", async () => {
    const { grace } = await withDuels();

    const duel = await grace.replay("grace-linus");

    expect(duel.outcome).toBe("draw");
    expect(duel.me.score).toBeNull();
    expect(duel.opponent?.score).toBeNull();
  });

  test("a User who did not play the Duel gets 404, like for a Duel that does not exist", async () => {
    const { ada, duelResponse } = await withDuels();

    const responses = await Promise.all([
      duelResponse(ada.cookie, "grace-linus"),
      duelResponse(ada.cookie, "no-such-duel"),
    ]);

    expect(responses.map((response) => response.status)).toEqual([404, 404]);

    // Nothing tells the Duel of others from one that does not exist.
    for (const body of await Promise.all(responses.map((response) => response.json()))) {
      expect(body).toMatchObject({ error: { code: "NOT_FOUND", message: "Duel not found" } });
    }
  });

  test("a Visitor gets 401", async () => {
    const { duelResponse } = await withDuels();

    const response = await duelResponse(null, "ada-alan");

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  test("once the opponent's User is deleted, only the reader's side is left", async () => {
    const { auth, duels, ada, alan } = await withDuels();

    await (await auth.$context).internalAdapter.deleteUser(alan.id);
    duels.deleteUser(alan.id);

    const duel = await ada.replay("ada-alan");

    expect(duel.opponent).toBeNull();
    expect(duel.me.keystrokes).toEqual(adaTyped);
  });
});
