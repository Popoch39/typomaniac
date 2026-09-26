import { describe, expect, test } from "bun:test";
import { byStanding, type Rank, type Standing } from "ranked";
import { currentWordListVersion, defaultPace } from "typing-engine";

import { createApp } from "../../app";
import { createTestAuth, memoryDuelStore, signIn, testConfig, testUsers } from "../../test-app";
import type { DuelPlayerRecord, DuelRecord } from "../duel/store";

const standing = (tier: "argent" | "or" | "platine", tp = 50): Standing => ({
  tier,
  division: 4,
  tp,
  shielded: false,
});

let duelCount = 0;

const player = (userId: string): DuelPlayerRecord => ({
  userId,
  result: {
    wpm: 60,
    raw: 60,
    accuracy: 100,
    consistency: 80,
    chars: { correct: 150, incorrect: 0, extra: 0, missed: 0 },
  },
  pace: defaultPace,
  score: null,
  keystrokes: [],
  rated: null,
});

// A Ranked Duel `userId` won or lost against `opponentId`, which moved them from `before` to
// `after`.
const rankedDuel = (
  userId: string,
  opponentId: string,
  { before, after }: { before: Standing; after: Standing },
) => {
  duelCount += 1;

  const record: DuelRecord = {
    id: `duel-${duelCount}`,
    seed: 1,
    language: "en",
    wordListVersion: currentWordListVersion.en,
    seconds: 30,
    startsAt: duelCount * 60_000,
    mode: "time",
    endedAt: duelCount * 60_000 + 30_000,
    outcome: "win",
    winnerId: byStanding(before, after) > 0 ? userId : opponentId,
    players: [player(userId), player(opponentId)],
  };

  record.players[0].rated = {
    before: { mmr: 900, rank: before },
    after: { mmr: 900, rank: after },
    tp: 20,
  };

  return record;
};

const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const app = createApp(testConfig({ auth, users: testUsers(auth), duelStore: duels.store }));

  let count = 0;

  const newUser = async (rank: Rank | null) => {
    count += 1;

    const { user, cookie } = await signIn(auth, {
      name: `User ${count}`,
      email: `user-${count}@example.com`,
      handle: `user${count}`,
    });

    if (rank !== null) {
      duels.ratings.set(user.id, { mmr: 900, rank });
    }

    return { id: user.id, cookie };
  };

  // Any body, as a client could send it by hand.
  const putOrnament = (cookie: string | null, body: { choice?: string | number }) => {
    const headers = new Headers({ "content-type": "application/json" });

    if (cookie !== null) {
      headers.set("cookie", cookie);
    }

    return app.handle(
      new Request("http://localhost/api/me/ornament", {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      }),
    );
  };

  const getMe = async (cookie: string) =>
    (await app.handle(new Request("http://localhost/api/me", { headers: { cookie } }))).json();

  return { duels, newUser, putOrnament, getMe };
};

describe("PUT /api/me/ornament", () => {
  test("freezes a Tier under the User's own, and answers the User as /api/me does", async () => {
    const { newUser, putOrnament, getMe } = setup();
    const ada = await newUser(standing("or"));

    const response = await putOrnament(ada.cookie, { choice: "bronze" });

    expect(response.status).toBe(200);

    const me = await response.json();

    expect(me).toMatchObject({ handle: "user1", ornament: "bronze", ornamentChoice: "bronze" });
    expect(await getMe(ada.cookie)).toEqual(me);
  });

  test("accepts the User's own Tier, following it and wearing none", async () => {
    const { newUser, putOrnament } = setup();
    const ada = await newUser(standing("or"));

    expect(await (await putOrnament(ada.cookie, { choice: "or" })).json()).toMatchObject({
      ornament: "or",
      ornamentChoice: "or",
    });
    expect(await (await putOrnament(ada.cookie, { choice: "none" })).json()).toMatchObject({
      ornament: null,
      ornamentChoice: "none",
    });
    expect(await (await putOrnament(ada.cookie, { choice: "follow" })).json()).toMatchObject({
      ornament: "or",
      ornamentChoice: "follow",
    });
  });

  test("refuses a Tier above the User's own, and changes nothing", async () => {
    const { newUser, putOrnament, getMe } = setup();
    const ada = await newUser(standing("or"));

    await putOrnament(ada.cookie, { choice: "argent" });

    const response = await putOrnament(ada.cookie, { choice: "platine" });

    expect(response.status).toBe(403);
    expect(await getMe(ada.cookie)).toMatchObject({ ornament: "argent", ornamentChoice: "argent" });
  });

  test("refuses any choice in Placement or without a Rating", async () => {
    const { newUser, putOrnament, getMe } = setup();
    const placed = await newUser({ placementsLeft: 2 });
    const unranked = await newUser(null);

    const responses = await Promise.all(
      ["follow", "none", "fer"].flatMap((choice) => [
        putOrnament(placed.cookie, { choice }),
        putOrnament(unranked.cookie, { choice }),
      ]),
    );

    expect(responses.map((response) => response.status)).toEqual(Array(6).fill(403));
    expect(await getMe(placed.cookie)).toMatchObject({ ornament: null, ornamentChoice: "follow" });
    expect(await getMe(unranked.cookie)).toMatchObject({ ornament: null, ornamentChoice: null });
  });

  test("refuses what is not an Ornament choice", async () => {
    const { newUser, putOrnament } = setup();
    const ada = await newUser(standing("or"));

    const responses = await Promise.all(
      [{ choice: "maitre" }, { choice: 3 }, {}].map((body) => putOrnament(ada.cookie, body)),
    );

    expect(responses.map((response) => response.status)).toEqual([422, 422, 422]);
  });

  test("needs a Session", async () => {
    const { putOrnament } = setup();

    expect((await putOrnament(null, { choice: "follow" })).status).toBe(401);
  });

  test("keeps the frozen Tier through a fall under it, and wears it again once back", async () => {
    const { duels, newUser, putOrnament, getMe } = setup();
    const ada = await newUser(standing("or", 10));
    const alan = await newUser(standing("or"));

    await putOrnament(ada.cookie, { choice: "or" });
    await duels.store.save(
      rankedDuel(ada.id, alan.id, { before: standing("or", 10), after: standing("argent", 75) }),
    );

    expect(await getMe(ada.cookie)).toMatchObject({ ornament: "argent", ornamentChoice: "or" });

    await duels.store.save(
      rankedDuel(ada.id, alan.id, { before: standing("argent", 95), after: standing("or", 15) }),
    );

    expect(await getMe(ada.cookie)).toMatchObject({ ornament: "or", ornamentChoice: "or" });
  });
});
