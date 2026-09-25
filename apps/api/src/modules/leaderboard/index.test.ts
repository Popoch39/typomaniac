import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Rank, Standing } from "ranked";

import { createApp } from "../../app";
import { createTestAuth, memoryDuelStore, signIn, testConfig, testUsers } from "../../test-app";
import { LEADERBOARD_LIMIT, LeaderboardModel } from "./model";

const leaderboardBody = TypeCompiler.Compile(LeaderboardModel.leaderboard);

const or = (division: 4 | 3 | 2 | 1, tp: number): Standing => ({
  tier: "or",
  division,
  tp,
  shielded: false,
});

// A fresh app per test: its Users and its Ratings are its own.
const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const users = testUsers(auth);
  const app = createApp(testConfig({ auth, users, duelStore: duels.store }));

  let count = 0;

  const leaderboardResponse = (cookie: string | null) =>
    app.handle(
      new Request("http://localhost/api/leaderboard", {
        headers: cookie === null ? undefined : { cookie },
      }),
    );

  // A User with a Handle, and a Rating of `rank` when given (its MMR, 4242, is never shown).
  const newUser = async (handle: string, rank?: Rank) => {
    count += 1;

    const { user, cookie } = await signIn(auth, {
      name: `User ${count}`,
      email: `user-${count}@example.com`,
      image: `https://example.com/${count}.png`,
      handle,
    });

    if (rank) {
      duels.ratings.set(user.id, { mmr: 4242, rank });
    }

    return { id: user.id, cookie };
  };

  const leaderboardOf = async (cookie: string) => {
    const response = await leaderboardResponse(cookie);

    expect(response.status).toBe(200);

    const body = await response.json();

    if (!leaderboardBody.Check(body)) {
      throw new Error(`Not a Classement: ${JSON.stringify(body)}`);
    }

    return body;
  };

  return { duels, users, leaderboardResponse, newUser, leaderboardOf };
};

describe("GET /api/leaderboard", () => {
  test("needs a Session", async () => {
    const { leaderboardResponse } = setup();

    expect((await leaderboardResponse(null)).status).toBe(401);
  });

  test("is empty before anyone is past Placement", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", { placementsLeft: 2 });

    expect(await leaderboardOf(ada.cookie)).toEqual({ entries: [], me: null });
  });

  test("orders by Tier, then Division, then TP, Maître by TP", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", or(4, 90));

    await newUser("alan", { tier: "maitre", tp: 10, shielded: false });
    await newUser("grace", or(3, 5));
    await newUser("linus", { tier: "platine", division: 4, tp: 0, shielded: true });
    await newUser("barbara", { tier: "maitre", tp: 320, shielded: false });
    await newUser("ken", or(4, 20));

    const { entries } = await leaderboardOf(ada.cookie);

    expect(entries.map(({ position, handle }) => [position, handle])).toEqual([
      [1, "barbara"],
      [2, "alan"],
      [3, "linus"],
      [4, "grace"],
      [5, "ada"],
      [6, "ken"],
    ]);
    expect(entries[4]).toEqual({
      position: 5,
      handle: "ada",
      image: "https://example.com/1.png",
      rank: { tier: "or", division: 4, tp: 90, shielded: false },
    });
  });

  test("leaves out the Users in Placement and those who never joined the Queue", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", or(4, 10));

    await newUser("alan", { placementsLeft: 1 });
    await newUser("grace");

    expect((await leaderboardOf(ada.cookie)).entries.map((entry) => entry.handle)).toEqual(["ada"]);
  });

  test("never shows the MMR, the name nor the email", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", or(2, 42));

    const body = JSON.stringify(await leaderboardOf(ada.cookie));

    expect(body).not.toContain("4242");
    expect(body).not.toContain("@example.com");
    expect(body).not.toContain("User 1");
  });

  describe("the reader", () => {
    test("stands where they are, highlighted apart from the list", async () => {
      const { newUser, leaderboardOf } = setup();

      await newUser("alan", or(1, 0));

      const ada = await newUser("ada", or(4, 10));

      expect((await leaderboardOf(ada.cookie)).me).toEqual({
        position: 2,
        handle: "ada",
        image: "https://example.com/2.png",
        rank: or(4, 10),
      });
    });

    test("stands past the first Users shown", async () => {
      const { duels, newUser, leaderboardOf } = setup();

      for (let index = 0; index < LEADERBOARD_LIMIT; index += 1) {
        duels.ratings.set(`strong-${index}`, { mmr: 1, rank: or(1, index) });
      }

      const ada = await newUser("ada", or(4, 0));
      const leaderboard = await leaderboardOf(ada.cookie);

      expect(leaderboard.entries).toHaveLength(0);
      expect(leaderboard.me?.position).toBe(LEADERBOARD_LIMIT + 1);
    });

    test("is null in Placement", async () => {
      const { newUser, leaderboardOf } = setup();

      await newUser("alan", or(1, 0));

      const ada = await newUser("ada", { placementsLeft: 3 });

      expect((await leaderboardOf(ada.cookie)).me).toBeNull();
    });
  });

  test("keeps the place of a User without a Handle, left out of the list", async () => {
    const { duels, newUser, leaderboardOf } = setup();

    duels.ratings.set("handleless", { mmr: 1, rank: or(1, 0) });

    const ada = await newUser("ada", or(4, 0));

    expect((await leaderboardOf(ada.cookie)).entries).toEqual([
      expect.objectContaining({ position: 2, handle: "ada" }),
    ]);
  });

  test("forgets a deleted User", async () => {
    const { duels, newUser, leaderboardOf } = setup();
    const alan = await newUser("alan", or(1, 0));
    const ada = await newUser("ada", or(4, 0));

    duels.deleteUser(alan.id);

    expect((await leaderboardOf(ada.cookie)).me?.position).toBe(1);
  });
});
