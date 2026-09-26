import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Standing } from "ranked";
import { currentWordListVersion, defaultPace } from "typing-engine";

import { createApp } from "../../app";
import { createTestAuth, memoryDuelStore, signIn, testConfig, testUsers } from "../../test-app";
import type { DuelPlayerRecord, DuelRecord } from "../duel/store";
import { ProfileModel } from "./model";

const profileBody = TypeCompiler.Compile(ProfileModel.profile);

type Side = {
  userId: string;
  wpm: number;
  accuracy?: number;
  score: { score: number; bestCombo: number } | null;
};

let duelCount = 0;

// A finished Duel between two Users: `outcome` and `winnerId` as the server wrote them.
const finishedDuel = ({
  outcome = "win",
  winnerId = null,
  players: [first, second],
}: {
  outcome?: DuelRecord["outcome"];
  winnerId?: string | null;
  players: [Side, Side];
}): DuelRecord => {
  const player = ({ userId, wpm, accuracy = 100, score }: Side): DuelPlayerRecord => ({
    userId,
    result: {
      wpm,
      raw: wpm,
      accuracy,
      consistency: 80,
      chars: { correct: wpm * 2.5, incorrect: 0, extra: 0, missed: 0 },
    },
    pace: defaultPace,
    score: score === null ? null : { ...score, bursts: 1 },
    keystrokes: [],
    rated: null,
  });

  duelCount += 1;

  return {
    id: `duel-${duelCount}`,
    seed: 1,
    language: "en",
    wordListVersion: currentWordListVersion.en,
    seconds: 30,
    startsAt: duelCount * 60_000,
    mode: "time",
    endedAt: duelCount * 60_000 + 30_000,
    outcome,
    winnerId,
    players: [player(first), player(second)],
  };
};

// `count` Duels `ada` won, their wpm 1, 2, 3… in the order they ended.
const played = (count: number, ada: string, alan: string, outcome?: DuelRecord["outcome"]) =>
  Array.from({ length: count }, (_, index) =>
    finishedDuel({
      outcome,
      winnerId: ada,
      players: [
        { userId: ada, wpm: index + 1, score: null },
        { userId: alan, wpm: 10, score: null },
      ],
    }),
  );

const standing = (tier: "argent" | "or" | "platine", tp = 50): Standing => ({
  tier,
  division: 1,
  tp,
  shielded: false,
});

// A Ranked Duel `userId` won, which moved them from `before` to `after`.
const rankedDuel = (userId: string, opponentId: string, before: Standing, after: Standing) => {
  const record = finishedDuel({
    winnerId: userId,
    players: [
      { userId, wpm: 80, score: null },
      { userId: opponentId, wpm: 60, score: null },
    ],
  });

  record.players[0].rated = {
    before: { mmr: 900, rank: before },
    after: { mmr: 920, rank: after },
    tp: 20,
  };

  return record;
};

// The wpm of the last `count` of `total` Duels from `played`: up to `total`.
const last = (count: number, total: number) =>
  Array.from({ length: count }, (_, index) => total - count + 1 + index);

// A fresh app per test: its Users and its Duels are its own.
const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const users = testUsers(auth);
  const app = createApp(testConfig({ auth, users, duelStore: duels.store }));

  let count = 0;

  const profileResponse = (cookie: string | null, handle: string, window?: string) =>
    app.handle(
      new Request(
        `http://localhost/api/users/${handle}/profile${window ? `?window=${window}` : ""}`,
        {
          headers: cookie === null ? undefined : { cookie },
        },
      ),
    );

  const newUser = async (handle: string) => {
    count += 1;

    const image = `https://example.com/${count}.png`;

    const { user, cookie } = await signIn(auth, {
      name: `User ${count}`,
      email: `user-${count}@example.com`,
      image,
      handle,
    });

    return { id: user.id, image, cookie };
  };

  const profileOf = async (cookie: string, handle: string, window?: string) => {
    const response = await profileResponse(cookie, handle, window);

    expect(response.status).toBe(200);

    const body = await response.json();

    if (!profileBody.Check(body)) {
      throw new Error(`Not a Profile: ${JSON.stringify(body)}`);
    }

    return body;
  };

  return { duels, users, profileResponse, newUser, profileOf };
};

describe("GET /api/users/:handle/profile", () => {
  test("needs a Session", async () => {
    const { profileResponse, newUser } = setup();

    await newUser("ada");

    expect((await profileResponse(null, "ada")).status).toBe(401);
  });

  test("finds nobody behind an unknown Handle", async () => {
    const { profileResponse, newUser } = setup();
    const ada = await newUser("ada");

    const response = await profileResponse(ada.cookie, "nobody");

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  test("finds the User whatever the case of the Handle", async () => {
    const { newUser, profileOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    const profile = await profileOf(ada.cookie, "ALan");

    expect(profile.handle).toBe("alan");
    expect(profile.image).toBe(alan.image);
  });

  test("finds nobody behind a Handle given up, the User behind their Handle of today", async () => {
    const { users, profileResponse, newUser, profileOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    await users.setHandle(alan.id, "turing");

    expect((await profileResponse(ada.cookie, "alan")).status).toBe(404);
    expect((await profileOf(ada.cookie, "turing")).handle).toBe("turing");
  });

  test("never shows the email nor the name", async () => {
    const { newUser, profileOf } = setup();
    const ada = await newUser("ada");

    await newUser("alan");

    const profile = await profileOf(ada.cookie, "alan");

    expect(Object.keys(profile).toSorted()).toEqual([
      "handle",
      "image",
      "ornament",
      "rank",
      "stats",
    ]);
    expect(JSON.stringify(profile)).not.toContain("@example.com");
    expect(JSON.stringify(profile)).not.toContain("User 2");
  });

  describe("the rank", () => {
    test("is null for a User who never joined the Queue", async () => {
      const { newUser, profileOf } = setup();
      const ada = await newUser("ada");

      expect((await profileOf(ada.cookie, "ada")).rank).toBeNull();
    });

    test("shows the Tier, Division and TP of any User, never their MMR", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");
      const alan = await newUser("alan");

      duels.ratings.set(alan.id, {
        mmr: 987,
        rank: { tier: "or", division: 2, tp: 42, shielded: false },
      });

      const profile = await profileOf(ada.cookie, "alan");

      expect(profile.rank).toEqual({ tier: "or", division: 2, tp: 42, shielded: false });
      expect(JSON.stringify(profile)).not.toContain("987");
    });

    test("shows the Placement Duels left", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");

      duels.ratings.set(ada.id, { mmr: 600, rank: { placementsLeft: 3 } });

      expect((await profileOf(ada.cookie, "ada")).rank).toEqual({ placementsLeft: 3 });
    });
  });

  describe("the Ornament", () => {
    test("is null for a User who never joined the Queue, and in Placement", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");

      expect((await profileOf(ada.cookie, "ada")).ornament).toBeNull();

      duels.ratings.set(ada.id, { mmr: 600, rank: { placementsLeft: 3 } });

      expect((await profileOf(ada.cookie, "ada")).ornament).toBeNull();
    });

    test("is the one of the User's current Tier, seen by any User", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");
      const alan = await newUser("alan");

      duels.ratings.set(alan.id, { mmr: 987, rank: standing("or") });

      expect((await profileOf(ada.cookie, "alan")).ornament).toBe("or");
      expect((await profileOf(alan.cookie, "alan")).ornament).toBe("or");
    });

    test("follows a move up and a move down of Tier after a Ranked Duel", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");
      const alan = await newUser("alan");

      duels.ratings.set(alan.id, { mmr: 900, rank: standing("or", 95) });
      await duels.store.save(rankedDuel(alan.id, ada.id, standing("or", 95), standing("platine")));

      expect((await profileOf(ada.cookie, "alan")).ornament).toBe("platine");

      await duels.store.save(rankedDuel(alan.id, ada.id, standing("platine"), standing("or")));

      expect((await profileOf(ada.cookie, "alan")).ornament).toBe("or");
    });

    test("is resolved by the server, never the User's raw choice", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");
      const alan = await newUser("alan");

      duels.ratings.set(alan.id, { mmr: 700, rank: standing("argent") });
      duels.ornaments.set(alan.id, "platine");

      const profile = await profileOf(ada.cookie, "alan");

      expect(profile.ornament).toBe("argent");
      expect(JSON.stringify(profile)).not.toContain("platine");
    });
  });

  test("Stats without a Duel: nothing played, nothing to average", async () => {
    const { newUser, profileOf } = setup();
    const ada = await newUser("ada");

    expect((await profileOf(ada.cookie, "ada")).stats).toEqual({
      duels: 0,
      record: { wins: 0, losses: 0, draws: 0 },
      averages: { wpm: null, accuracy: null },
      records: { wpm: null, score: null, combo: null },
      progression: [],
    });
  });

  describe("the Progression", () => {
    test("leaves out the Forfeits, which the record still counts, oldest first", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");
      const alan = await newUser("alan");

      const [first, second] = played(2, ada.id, alan.id);
      const [forfeit] = played(1, ada.id, alan.id, "forfeit");

      if (!first || !second || !forfeit) {
        throw new Error("Three Duels expected");
      }

      duels.saved.push(second, forfeit, first);

      const { stats } = await profileOf(ada.cookie, "ada");

      expect(stats.record.wins).toBe(3);
      expect(stats.progression).toEqual([
        { endedAt: first.endedAt, wpm: 1, raw: 1, accuracy: 100, consistency: 80 },
        { endedAt: second.endedAt, wpm: 2, raw: 2, accuracy: 100, consistency: 80 },
      ]);
    });

    test("the last 50 Duels by default, 200 or all of them on demand", async () => {
      const { duels, newUser, profileOf } = setup();
      const ada = await newUser("ada");
      const alan = await newUser("alan");

      duels.saved.push(...played(210, ada.id, alan.id), ...played(3, ada.id, alan.id, "forfeit"));

      const wpms = async (window?: string) =>
        (await profileOf(ada.cookie, "ada", window)).stats.progression.map(({ wpm }) => wpm);

      expect(await wpms()).toEqual(last(50, 210));
      expect(await wpms("50")).toEqual(last(50, 210));
      expect(await wpms("200")).toEqual(last(200, 210));
      expect(await wpms("all")).toEqual(last(210, 210));

      const { stats } = await profileOf(ada.cookie, "ada", "50");

      expect(stats.duels).toBe(213);
      expect(stats.record.wins).toBe(213);
    });

    test("refuses any other window", async () => {
      const { profileResponse, newUser } = setup();
      const ada = await newUser("ada");

      const response = await profileResponse(ada.cookie, "ada", "100");

      expect(response.status).toBe(422);
    });
  });

  test("the record seen from the User, Forfeits included", async () => {
    const { duels, newUser, profileOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    const both = (adaWpm: number, alanWpm: number): [Side, Side] => [
      { userId: ada.id, wpm: adaWpm, score: { score: 100, bestCombo: 5 } },
      { userId: alan.id, wpm: alanWpm, score: { score: 50, bestCombo: 3 } },
    ];

    duels.saved.push(
      finishedDuel({ winnerId: ada.id, players: both(90, 80) }),
      finishedDuel({ outcome: "forfeit", winnerId: ada.id, players: both(70, 20) }),
      finishedDuel({ outcome: "forfeit", winnerId: alan.id, players: both(10, 60) }),
      finishedDuel({ outcome: "draw", players: both(80, 80) }),
    );

    const adaStats = (await profileOf(alan.cookie, "ada")).stats;

    expect(adaStats.duels).toBe(4);
    expect(adaStats.record).toEqual({ wins: 2, losses: 1, draws: 1 });
    expect(adaStats.averages.wpm).toBe(62.5);
    expect(adaStats.records.wpm).toBe(90);

    expect((await profileOf(ada.cookie, "alan")).stats.record).toEqual({
      wins: 1,
      losses: 2,
      draws: 1,
    });
  });

  test("the best Score and Combo leave out the Duels before the Score", async () => {
    const { duels, newUser, profileOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 120, accuracy: 90, score: null },
          { userId: alan.id, wpm: 60, score: null },
        ],
      }),
    );

    expect((await profileOf(ada.cookie, "ada")).stats.records).toEqual({
      wpm: 120,
      score: null,
      combo: null,
    });

    duels.saved.push(
      finishedDuel({
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 80, accuracy: 100, score: { score: 900, bestCombo: 40 } },
          { userId: alan.id, wpm: 60, score: { score: 400, bestCombo: 12 } },
        ],
      }),
    );

    const { averages, records } = (await profileOf(ada.cookie, "ada")).stats;

    expect(records).toEqual({ wpm: 120, score: 900, combo: 40 });
    expect(averages).toEqual({ wpm: 100, accuracy: 95 });
  });

  test("the Duels against a deleted User still count", async () => {
    const { duels, newUser, profileOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duels.saved.push(
      finishedDuel({
        winnerId: alan.id,
        players: [
          { userId: ada.id, wpm: 70, score: { score: 300, bestCombo: 9 } },
          { userId: alan.id, wpm: 90, score: { score: 800, bestCombo: 20 } },
        ],
      }),
      finishedDuel({
        winnerId: ada.id,
        players: [
          { userId: ada.id, wpm: 90, score: { score: 700, bestCombo: 15 } },
          { userId: alan.id, wpm: 50, score: { score: 100, bestCombo: 4 } },
        ],
      }),
    );

    duels.deleteUser(alan.id);

    const { stats } = await profileOf(ada.cookie, "ada");

    expect(stats.duels).toBe(2);
    expect(stats.record).toEqual({ wins: 1, losses: 1, draws: 0 });
  });
});
