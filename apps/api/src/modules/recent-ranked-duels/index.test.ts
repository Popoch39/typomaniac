import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Rank, Rating } from "ranked";

import { createApp } from "../../app";
import {
  createTestAuth,
  memoryDuelStore,
  pastDuel,
  signIn,
  testConfig,
  testUsers,
} from "../../test-app";
import type { DuelRecord } from "../duel/store";
import { RecentRankedDuelsModel } from "./model";

const recentDuelsBody = TypeCompiler.Compile(RecentRankedDuelsModel.recentDuels);

const gold: Rank = { tier: "gold", division: 2, tp: 40, shielded: false };

const silver: Rank = { tier: "silver", division: 1, tp: 10, shielded: false };

const maniac: Rank = { tier: "maniac", tp: 120, shielded: false };

// A fresh app per test.
const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const users = testUsers(auth);
  const app = createApp(testConfig({ auth, users, duelStore: duels.store }));

  let count = 0;

  // A User with a Handle, at `rank` today, or without a Rating.
  const newUser = async (handle: string, rank: Rank | null) => {
    count += 1;

    const { user, cookie } = await signIn(auth, {
      name: `User ${count}`,
      email: `user-${count}@example.com`,
      handle,
    });

    if (rank !== null) {
      duels.ratings.set(user.id, { mmr: 1000, rank });
    }

    return { id: user.id, handle, cookie };
  };

  // A finished Duel, `winner` first at 104 wpm, `loser` at 97: Ranked (both rated) unless a
  // Challenge.
  const duel = (
    winner: { id: string },
    loser: { id: string },
    endedAt: number,
    { outcome = "win", ranked = true }: { outcome?: DuelRecord["outcome"]; ranked?: boolean } = {},
  ) => {
    const record = pastDuel(winner.id, 104, endedAt);
    const [first, second] = record.players;
    const rating: Rating = { mmr: 1000, rank: gold };
    const rated = ranked ? { before: rating, after: rating, tp: 18 } : null;

    duels.saved.push({
      ...record,
      outcome,
      winnerId: outcome === "draw" ? null : winner.id,
      players: [
        { ...first, rated },
        { ...second, userId: loser.id, result: { ...second.result, wpm: 97 }, rated },
      ],
    });

    return record.id;
  };

  const response = (cookie?: string) =>
    app.handle(
      new Request("http://localhost/api/ranked/recent-duels", {
        headers: cookie === undefined ? undefined : { cookie },
      }),
    );

  const recentDuelsOf = async (cookie: string) => {
    const reply = await response(cookie);

    expect(reply.status).toBe(200);

    const body = await reply.json();

    if (!recentDuelsBody.Check(body)) {
      throw new Error(`Not the recent Duels: ${JSON.stringify(body)}`);
    }

    return body;
  };

  return { duels, newUser, duel, response, recentDuelsOf };
};

describe("GET /api/ranked/recent-duels", () => {
  test("lists the last 3 Ranked Duels won in the reader's Tier, the most recent first", async () => {
    const { newUser, duel, recentDuelsOf } = setup();
    const ada = await newUser("ada", gold);
    const mia = await newUser("mia", gold);
    const noe = await newUser("noe", silver);
    const zoe = await newUser("zoe", gold);

    duel(mia, noe, 1_000);
    const second = duel(zoe, mia, 2_000);
    const third = duel(mia, zoe, 3_000, { outcome: "forfeit" });
    const last = duel(mia, noe, 4_000);

    expect(await recentDuelsOf(ada.cookie)).toEqual({
      tier: "gold",
      duels: [
        {
          id: last,
          endedAt: 4_000,
          winner: { handle: "mia", wpm: 104 },
          loser: { handle: "noe", wpm: 97 },
        },
        {
          id: third,
          endedAt: 3_000,
          winner: { handle: "mia", wpm: 104 },
          loser: { handle: "zoe", wpm: 97 },
        },
        {
          id: second,
          endedAt: 2_000,
          winner: { handle: "zoe", wpm: 104 },
          loser: { handle: "mia", wpm: 97 },
        },
      ],
    });
  });

  test("keeps the Duels whose winner is in the reader's Tier today, not their loser", async () => {
    const { newUser, duel, recentDuelsOf } = setup();
    const ada = await newUser("ada", silver);
    const mia = await newUser("mia", gold);
    const noe = await newUser("noe", silver);

    duel(mia, noe, 1_000);
    const won = duel(noe, mia, 2_000);

    expect(await recentDuelsOf(ada.cookie)).toMatchObject({
      tier: "silver",
      duels: [{ id: won, winner: { handle: "noe" } }],
    });
  });

  test("leaves out the Challenges and the Draws", async () => {
    const { newUser, duel, recentDuelsOf } = setup();
    const ada = await newUser("ada", gold);
    const mia = await newUser("mia", gold);
    const zoe = await newUser("zoe", gold);

    duel(mia, zoe, 1_000, { ranked: false });
    duel(mia, zoe, 2_000, { outcome: "draw" });

    expect(await recentDuelsOf(ada.cookie)).toEqual({ tier: "gold", duels: [] });
  });

  test("the Maniacs see the Maniacs' Duels", async () => {
    const { newUser, duel, recentDuelsOf } = setup();
    const ada = await newUser("ada", maniac);
    const mia = await newUser("mia", maniac);
    const zoe = await newUser("zoe", gold);

    const won = duel(mia, zoe, 1_000);
    duel(zoe, mia, 2_000);

    expect(await recentDuelsOf(ada.cookie)).toMatchObject({
      tier: "maniac",
      duels: [{ id: won }],
    });
  });

  test.each([
    ["in Placement", { placementsLeft: 2 }],
    ["without a Rating", null],
  ] as const)("%s, the reader sees every Tier", async (_, rank) => {
    const { newUser, duel, recentDuelsOf } = setup();
    const ada = await newUser("ada", rank);
    const mia = await newUser("mia", gold);
    const noe = await newUser("noe", silver);
    const leo = await newUser("leo", { placementsLeft: 1 });

    const first = duel(mia, noe, 1_000);
    const second = duel(noe, mia, 2_000);
    const third = duel(leo, noe, 3_000);

    const { tier, duels } = await recentDuelsOf(ada.cookie);

    expect(tier).toBeNull();
    expect(duels.map(({ id }) => id)).toEqual([third, second, first]);
  });

  test("leaves out a Duel whose player was deleted", async () => {
    const { duels, newUser, duel, recentDuelsOf } = setup();
    const ada = await newUser("ada", gold);
    const mia = await newUser("mia", gold);
    const noe = await newUser("noe", gold);

    duel(mia, noe, 1_000);
    duels.deleteUser(noe.id);

    expect(await recentDuelsOf(ada.cookie)).toEqual({ tier: "gold", duels: [] });
  });

  test("refuses a Visitor", async () => {
    const { response } = setup();

    const reply = await response();

    expect(reply.status).toBe(401);
    expect(await reply.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });
});
