import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Rank, Standing } from "ranked";

import { createApp } from "../../app";
import { createTestAuth, memoryDuelStore, signIn, testConfig, testUsers } from "../../test-app";
import { LEADERBOARD_PAGE, type Leaderboard, LeaderboardModel } from "./model";

const leaderboardBody = TypeCompiler.Compile(LeaderboardModel.leaderboard);

const gold = (division: 4 | 3 | 2 | 1, tp: number): Standing => ({
  tier: "gold",
  division,
  tp,
  shielded: false,
});

const maniac = (tp: number): Standing => ({ tier: "maniac", tp, shielded: false });

const emptyPage = {
  entries: [],
  me: null,
  firstPlace: 1,
  lastPlace: 0,
  total: 0,
  previous: null,
  next: null,
};

// A cursor as the API writes one, for a row's key written by hand.
const cursorFor = (key: string) => Buffer.from(key).toString("base64url");

// A fresh app per test: its Users and its Ratings are its own.
const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const users = testUsers(auth);
  const app = createApp(testConfig({ auth, users, duelStore: duels.store }));

  let count = 0;

  const leaderboardResponse = (cookie: string | null, search = "") =>
    app.handle(
      new Request(`http://localhost/api/leaderboard${search}`, {
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

  const leaderboardOf = async (cookie: string, search = "") => {
    const response = await leaderboardResponse(cookie, search);

    expect(response.status).toBe(200);

    const body = await response.json();

    if (!leaderboardBody.Check(body)) {
      throw new Error(`Not a Leaderboard: ${JSON.stringify(body)}`);
    }

    return body;
  };

  return { duels, users, leaderboardResponse, newUser, leaderboardOf };
};

const placesOf = ({ entries }: Leaderboard) => entries.map(({ place, handle }) => [place, handle]);

// `player-00` first, `player-59` last, each on their own TP.
const handleAt = (index: number) => `player-${String(index).padStart(2, "0")}`;

const expectedPlaces = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => [from + index, handleAt(from + index - 1)]);

// 60 Users, `player-00` first: pages of 1–25, 26–50 and 51–60. The reader is `player-<at>`.
const sixty = async (at: number) => {
  const context = setup();

  const players = await Promise.all(
    Array.from({ length: 60 }, (_, index) =>
      context.newUser(handleAt(index), maniac(1000 - index)),
    ),
  );

  const reader = players[at];

  if (!reader) {
    throw new Error(`No player ${at}`);
  }

  return { ...context, reader };
};

describe("GET /api/leaderboard", () => {
  test("needs a Session", async () => {
    const { leaderboardResponse } = setup();

    expect((await leaderboardResponse(null)).status).toBe(401);
  });

  test("is empty before anyone is past Placement", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", { placementsLeft: 2 });

    expect(await leaderboardOf(ada.cookie)).toEqual(emptyPage);
  });

  test("orders by Tier, then Division, then TP, Maniac by TP", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", gold(4, 90));

    await newUser("alan", maniac(10));
    await newUser("grace", gold(3, 5));
    await newUser("linus", { tier: "platinum", division: 4, tp: 0, shielded: true });
    await newUser("barbara", maniac(320));
    await newUser("ken", gold(4, 20));

    const leaderboard = await leaderboardOf(ada.cookie);

    expect(placesOf(leaderboard)).toEqual([
      [1, "barbara"],
      [2, "alan"],
      [3, "linus"],
      [4, "grace"],
      [5, "ada"],
      [6, "ken"],
    ]);
    expect(leaderboard.entries[4]).toEqual({
      place: 5,
      handle: "ada",
      image: "https://example.com/1.png",
      ornament: "gold",
      rank: { tier: "gold", division: 4, tp: 90, shielded: false },
    });
    expect(leaderboard).toMatchObject({ firstPlace: 1, total: 6, previous: null, next: null });
  });

  test("leaves out the Users in Placement and those who never joined the Queue", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", gold(4, 10));

    await newUser("alan", { placementsLeft: 1 });
    await newUser("grace");

    const leaderboard = await leaderboardOf(ada.cookie);

    expect(leaderboard.entries.map((entry) => entry.handle)).toEqual(["ada"]);
    expect(leaderboard.total).toBe(1);
  });

  test("never shows the MMR, the name nor the email", async () => {
    const { newUser, leaderboardOf } = setup();
    const ada = await newUser("ada", gold(2, 42));

    const body = JSON.stringify(await leaderboardOf(ada.cookie));

    expect(body).not.toContain("4242");
    expect(body).not.toContain("@example.com");
    expect(body).not.toContain("User 1");
  });

  describe("its pages", () => {
    test("start with the first 25 Places", async () => {
      const { reader, leaderboardOf } = await sixty(0);
      const first = await leaderboardOf(reader.cookie);

      expect(placesOf(first)).toEqual(expectedPlaces(1, LEADERBOARD_PAGE));
      expect(first).toMatchObject({ firstPlace: 1, total: 60, previous: null });
      expect(first.next).not.toBeNull();
    });

    test("go on after a page, to the last one", async () => {
      const { reader, leaderboardOf } = await sixty(0);
      const first = await leaderboardOf(reader.cookie);
      const second = await leaderboardOf(reader.cookie, `?after=${first.next}`);
      const last = await leaderboardOf(reader.cookie, `?after=${second.next}`);

      expect(placesOf(second)).toEqual(expectedPlaces(26, 50));
      expect(second.firstPlace).toBe(26);
      expect(second.previous).not.toBeNull();
      expect(placesOf(last)).toEqual(expectedPlaces(51, 60));
      expect(last).toMatchObject({ firstPlace: 51, lastPlace: 60, next: null });
    });

    test("go back before a page, to the first one", async () => {
      const { reader, leaderboardOf } = await sixty(0);
      const first = await leaderboardOf(reader.cookie);
      const second = await leaderboardOf(reader.cookie, `?after=${first.next}`);
      const last = await leaderboardOf(reader.cookie, `?after=${second.next}`);
      const back = await leaderboardOf(reader.cookie, `?before=${last.previous}`);
      const front = await leaderboardOf(reader.cookie, `?before=${back.previous}`);

      expect(placesOf(back)).toEqual(expectedPlaces(26, 50));
      expect(back.next).toBe(second.next);
      expect(placesOf(front)).toEqual(expectedPlaces(1, LEADERBOARD_PAGE));
      expect(front).toMatchObject({ firstPlace: 1, previous: null });
    });

    test("keep Users of the same rank apart, each on one page", async () => {
      const { newUser, leaderboardOf } = setup();

      const ada = await newUser("ada");

      await Promise.all(
        Array.from({ length: LEADERBOARD_PAGE + 1 }, (_, index) =>
          newUser(handleAt(index), gold(2, 50)),
        ),
      );

      const first = await leaderboardOf(ada.cookie);
      const second = await leaderboardOf(ada.cookie, `?after=${first.next}`);
      const handles = [...first.entries, ...second.entries].map((entry) => entry.handle);

      expect(second.entries.map((entry) => entry.place)).toEqual([LEADERBOARD_PAGE + 1]);
      expect(new Set(handles).size).toBe(LEADERBOARD_PAGE + 1);
    });

    test("fall back to the first page past the last row", async () => {
      const { reader, leaderboardOf } = await sixty(0);
      const first = await leaderboardOf(reader.cookie);

      expect(placesOf(await leaderboardOf(reader.cookie, `?after=${cursorFor("0:0:a")}`))).toEqual(
        placesOf(first),
      );
    });

    describe("the reader's own page", () => {
      test.each([
        [0, 1],
        [24, 1],
        [25, 26],
        [37, 26],
        [59, 51],
      ])("for `player-%i`, starts at Place %i", async (at, firstPlace) => {
        const { reader, leaderboardOf } = await sixty(at);
        const page = await leaderboardOf(reader.cookie, "?at=me");
        const lastPlace = Math.min(firstPlace + LEADERBOARD_PAGE - 1, 60);

        expect(placesOf(page)).toEqual(expectedPlaces(firstPlace, lastPlace));
        expect(page.firstPlace).toBe(firstPlace);
        expect(page.lastPlace).toBe(lastPlace);
        expect(page.me?.place).toBe(at + 1);
        expect(page.previous === null).toBe(firstPlace === 1);
        expect(page.next === null).toBe(lastPlace === 60);
      });

      test("is the first page in Placement", async () => {
        const { newUser, leaderboardOf } = setup();

        await newUser("alan", gold(1, 0));

        const ada = await newUser("ada", { placementsLeft: 3 });

        expect(placesOf(await leaderboardOf(ada.cookie, "?at=me"))).toEqual([[1, "alan"]]);
      });
    });

    test.each([
      [`?after=${cursorFor("nope")}`],
      [`?before=${cursorFor("1:x:ada")}`],
      ["?before=1:2:ada"],
      ["?at=you"],
      [`?after=${cursorFor("1:2:a")}&before=${cursorFor("1:2:b")}`],
      [`?after=${cursorFor("1:2:a")}&at=me`],
    ])("refuses %s", async (search) => {
      const { newUser, leaderboardResponse } = setup();
      const ada = await newUser("ada", gold(4, 0));

      expect((await leaderboardResponse(ada.cookie, search)).status).toBe(422);
    });
  });

  describe("the reader", () => {
    test("stands where they are, highlighted apart from the list", async () => {
      const { newUser, leaderboardOf } = setup();

      await newUser("alan", gold(1, 0));

      const ada = await newUser("ada", gold(4, 10));

      expect((await leaderboardOf(ada.cookie)).me).toEqual({
        place: 2,
        handle: "ada",
        image: "https://example.com/2.png",
        ornament: "gold",
        rank: gold(4, 10),
      });
    });

    test("stands past the page shown", async () => {
      const { duels, newUser, leaderboardOf } = setup();

      for (let index = 0; index < LEADERBOARD_PAGE; index += 1) {
        duels.ratings.set(`strong-${index}`, { mmr: 1, rank: gold(1, index) });
      }

      const ada = await newUser("ada", gold(4, 0));
      const leaderboard = await leaderboardOf(ada.cookie);

      expect(leaderboard.entries).toHaveLength(0);
      expect(leaderboard.me?.place).toBe(LEADERBOARD_PAGE + 1);
    });

    test("is null in Placement", async () => {
      const { newUser, leaderboardOf } = setup();

      await newUser("alan", gold(1, 0));

      const ada = await newUser("ada", { placementsLeft: 3 });

      expect((await leaderboardOf(ada.cookie)).me).toBeNull();
    });
  });

  test("keeps the Place of a User without a Handle, left out of the list", async () => {
    const { duels, newUser, leaderboardOf } = setup();

    duels.ratings.set("handleless", { mmr: 1, rank: gold(1, 0) });

    const ada = await newUser("ada", gold(4, 0));

    expect((await leaderboardOf(ada.cookie)).entries).toEqual([
      expect.objectContaining({ place: 2, handle: "ada" }),
    ]);
  });

  describe("the Ornament", () => {
    test("is the one each User wears, resolved from their choice, the reader's too", async () => {
      const { duels, newUser, leaderboardOf } = setup();
      const alan = await newUser("alan", { tier: "platinum", division: 1, tp: 0, shielded: false });
      const grace = await newUser("grace", gold(1, 50));
      const ada = await newUser("ada", gold(4, 10));

      duels.ornaments.set(alan.id, "silver");
      duels.ornaments.set(grace.id, "none");

      const leaderboard = await leaderboardOf(ada.cookie);

      expect(leaderboard.entries.map(({ handle, ornament }) => [handle, ornament])).toEqual([
        ["alan", "silver"],
        ["grace", null],
        ["ada", "gold"],
      ]);
      expect(leaderboard.me?.ornament).toBe("gold");
    });

    test("reads the Ratings of all the Users at once, never one by one", async () => {
      const { duels, newUser, leaderboardOf } = setup();

      await newUser("alan", gold(1, 0));
      await newUser("grace", gold(2, 0));

      const ada = await newUser("ada", gold(4, 10));

      await leaderboardOf(ada.cookie);

      expect(duels.ornamentReads).toHaveLength(1);
    });
  });

  test("forgets a deleted User", async () => {
    const { duels, newUser, leaderboardOf } = setup();
    const alan = await newUser("alan", gold(1, 0));
    const ada = await newUser("ada", gold(4, 0));

    duels.deleteUser(alan.id);

    const leaderboard = await leaderboardOf(ada.cookie);

    expect(leaderboard.me?.place).toBe(1);
    expect(leaderboard.total).toBe(1);
  });
});
