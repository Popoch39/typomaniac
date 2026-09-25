import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { currentWordListVersion, defaultPace, type Keystroke } from "typing-engine";

import { createApp } from "../../app";
import { createTestAuth, memoryDuelStore, signIn, testConfig, testUsers } from "../../test-app";
import type { DuelPlayerRecord, DuelRecord } from "../duel/store";
import { DuelHistoryModel } from "./model";

const historyPage = TypeCompiler.Compile(DuelHistoryModel.page);

const replayedDuel = TypeCompiler.Compile(DuelHistoryModel.duel);

type Side = { userId: string; wpm: number; score: number | null; keystrokes?: Keystroke[] };

// A finished Duel between two Users: `outcome` and `winnerId` as the server wrote them.
const finishedDuel = ({
  id = crypto.randomUUID(),
  endedAt,
  outcome = "win",
  winnerId = null,
  players: [first, second],
}: {
  id?: string;
  endedAt: number;
  outcome?: DuelRecord["outcome"];
  winnerId?: string | null;
  players: [Side, Side];
}): DuelRecord => {
  const player = ({ userId, wpm, score, keystrokes = [] }: Side): DuelPlayerRecord => ({
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
    rated: null,
  });

  return {
    id,
    seed: 1,
    language: "en",
    wordListVersion: currentWordListVersion.en,
    seconds: 30,
    startsAt: endedAt - 30_000,
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

  const history = (cookie: string | null, query = "") =>
    app.handle(
      new Request(`http://localhost/api/duels${query}`, {
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

    const page = async (query = "") => {
      const response = await history(cookie, query);

      expect(response.status).toBe(200);

      const body = await response.json();

      if (!historyPage.Check(body)) {
        throw new Error(`Not a page of the Duel history: ${JSON.stringify(body)}`);
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

    return { id: user.id, image, cookie, page, replay };
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

    expect(await ada.page()).toEqual({
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
        },
      ],
      next: null,
    });
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

    expect(await ada.page()).toEqual({ duels: [], next: null });
  });

  test("pages of 20, the most recent first, then by id at the same end", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    // 45 Duels: pairs ending at the same instant, written in no particular order.
    const ids = Array.from({ length: 45 }, (_, index) => `duel-${String(index).padStart(2, "0")}`);

    duels.saved.push(
      ...ids.toReversed().map((id, index) =>
        finishedDuel({
          id,
          endedAt: 1_000_000 + Math.floor((ids.length - 1 - index) / 2) * 1000,
          outcome: "draw",
          players: [
            { userId: ada.id, wpm: 80, score: 10 },
            { userId: alan.id, wpm: 80, score: 10 },
          ],
        }),
      ),
    );

    const newestFirst = ids.toReversed();

    const first = await ada.page();

    expect(first.duels.map((entry: { id: string }) => entry.id)).toEqual(newestFirst.slice(0, 20));
    expect(first.next).toBeString();

    const second = await ada.page(`?before=${first.next}`);

    expect(second.duels.map((entry: { id: string }) => entry.id)).toEqual(
      newestFirst.slice(20, 40),
    );

    const last = await ada.page(`?before=${second.next}`);

    expect(last.duels.map((entry: { id: string }) => entry.id)).toEqual(newestFirst.slice(40));
    expect(last.next).toBeNull();
  });

  test("a page that ends exactly on the last Duel has no next", async () => {
    const { duels, newUser } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      ...Array.from({ length: 20 }, (_, index) =>
        finishedDuel({
          endedAt: 1000 * (index + 1),
          outcome: "draw",
          players: [
            { userId: ada.id, wpm: 80, score: 10 },
            { userId: alan.id, wpm: 80, score: 10 },
          ],
        }),
      ),
    );

    const page = await ada.page();

    expect(page.duels).toHaveLength(20);
    expect(page.next).toBeNull();
  });

  test("refuses a malformed cursor", async () => {
    const { newUser, history } = setup();
    const ada = await newUser("ada");

    const response = await history(ada.cookie, "?before=yesterday");

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
      (await user.page()).duels.map(
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

    const [entry] = (await ada.page()).duels;

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

    expect(await ada.page()).toEqual({
      duels: [
        {
          id: "duel-1",
          endedAt: 1000,
          opponent: null,
          outcome: "loss",
          forfeit: false,
          score: 500,
          opponentScore: null,
          wpm: 60,
          opponentWpm: null,
        },
      ],
      next: null,
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

    const [entry] = (await ada.page()).duels;

    expect(entry?.opponent).toEqual({ handle: "turing", image: alan.image });
    expect(JSON.stringify(entry)).not.toContain("User 2");
    expect(JSON.stringify(entry)).not.toContain("@example.com");
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
      me: { ...player(ada.image, "ada", 90, 1200), keystrokes: adaTyped },
      opponent: { ...player(alan.image, "alan", 70, 800), keystrokes: alanTyped },
    });

    const fromAlan = await alan.replay("ada-alan");

    expect(fromAlan.outcome).toBe("loss");
    expect(fromAlan.me.keystrokes).toEqual(alanTyped);
    expect(fromAlan.opponent?.handle).toBe("ada");
    expect(fromAlan.opponent?.keystrokes).toEqual(adaTyped);
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
