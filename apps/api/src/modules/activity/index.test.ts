import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { createApp } from "../../app";
import {
  createTestAuth,
  memoryDuelStore,
  memoryFriendStore,
  pastDuel,
  signIn,
  testConfig,
  testUsers,
} from "../../test-app";
import type { DuelRecord } from "../duel/store";
import { ActivityModel } from "./model";
import { ACTIVITY_LIMIT } from "./service";

const activitiesBody = TypeCompiler.Compile(ActivityModel.activities);

// A fresh app per test. Friendships are dated by `time`, moved forward by each one written.
const setup = () => {
  const auth = createTestAuth();
  const duels = memoryDuelStore();
  const users = testUsers(auth);
  let time = 1_000_000;
  const friendStore = memoryFriendStore({ now: () => time });
  const app = createApp(testConfig({ auth, users, duelStore: duels.store, friendStore }));

  let count = 0;

  const newUser = async (handle: string) => {
    count += 1;

    const image = `https://example.com/${count}.png`;

    const { user, cookie } = await signIn(auth, {
      name: `User ${count}`,
      email: `user-${count}@example.com`,
      image,
      handle,
    });

    return { id: user.id, handle, image, cookie };
  };

  const befriend = async (a: { id: string }, b: { id: string }, at: number) => {
    time = at;
    await friendStore.addRequest(a.id, b.id);
    await friendStore.acceptRequest(a.id, b.id);
  };

  // A Duel between two Users that ended at `endedAt`, `winner` first.
  const duel = (
    winner: { id: string },
    loser: { id: string },
    endedAt: number,
    outcome: DuelRecord["outcome"] = "win",
  ) => {
    const record = pastDuel(winner.id, 60, endedAt);
    const [first, second] = record.players;

    duels.saved.push({
      ...record,
      outcome,
      winnerId: outcome === "draw" ? null : winner.id,
      players: [first, { ...second, userId: loser.id, result: { ...second.result, wpm: 40 } }],
    });

    return record.id;
  };

  const activityResponse = (cookie?: string) =>
    app.handle(
      new Request("http://localhost/api/activity", {
        headers: cookie === undefined ? undefined : { cookie },
      }),
    );

  const activityOf = async (cookie: string) => {
    const response = await activityResponse(cookie);

    expect(response.status).toBe(200);

    const body = await response.json();

    if (!activitiesBody.Check(body)) {
      throw new Error(`Not Activities: ${JSON.stringify(body)}`);
    }

    return body;
  };

  return { duels, friendStore, newUser, befriend, duel, activityResponse, activityOf };
};

const userOf = ({ id, handle, image }: { id: string; handle: string; image: string }) => ({
  id,
  handle,
  image,
});

describe("GET /api/activity", () => {
  test("refuses a Visitor", async () => {
    const { activityResponse } = setup();

    const response = await activityResponse();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  test("is empty without a Friend", async () => {
    const { newUser, duel, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");

    duel(ada, alan, 5_000_000);

    expect(await activityOf(ada.cookie)).toEqual([]);
  });

  test("shows a Friend's Duels, against a stranger too, and their friendships, the newest first", async () => {
    const { newUser, befriend, duel, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");

    await befriend(ada, alan, 1_000);
    await befriend(alan, grace, 3_000);

    const won = duel(alan, grace, 2_000);
    const lost = duel(grace, alan, 4_000, "forfeit");

    expect(await activityOf(ada.cookie)).toEqual([
      {
        type: "duel",
        id: lost,
        at: 4_000,
        forfeit: true,
        friend: { ...userOf(alan), wpm: 40, outcome: "loss" },
        opponent: { ...userOf(grace), wpm: 60, outcome: "win" },
      },
      {
        type: "friendship",
        id: [alan.id, grace.id].toSorted().join(":"),
        at: 3_000,
        friend: userOf(alan),
        other: userOf(grace),
      },
      {
        type: "duel",
        id: won,
        at: 2_000,
        forfeit: false,
        friend: { ...userOf(alan), wpm: 60, outcome: "win" },
        opponent: { ...userOf(grace), wpm: 40, outcome: "loss" },
      },
      // Their own friendship, the Friend first.
      {
        type: "friendship",
        id: [ada.id, alan.id].toSorted().join(":"),
        at: 1_000,
        friend: userOf(alan),
        other: userOf(ada),
      },
    ]);
  });

  test("shows a Duel between two Friends once, and a Draw as one", async () => {
    const { newUser, befriend, duel, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");

    await befriend(ada, alan, 1_000);
    await befriend(ada, grace, 1_000);

    const drawn = duel(alan, grace, 5_000, "draw");

    const duels = (await activityOf(ada.cookie)).filter((activity) => activity.type === "duel");

    expect(duels).toEqual([
      {
        type: "duel",
        id: drawn,
        at: 5_000,
        forfeit: false,
        friend: expect.objectContaining({ outcome: "draw" }),
        opponent: expect.objectContaining({ outcome: "draw" }),
      },
    ]);
  });

  test("leaves out the Users who are not Friends, and the reader's own Duels with them", async () => {
    const { newUser, befriend, duel, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");
    const linus = await newUser("linus");

    await befriend(alan, grace, 1_000);
    duel(grace, linus, 2_000);
    duel(ada, linus, 3_000);

    expect(await activityOf(ada.cookie)).toEqual([]);
  });

  test("an ended friendship takes the ex-Friend's Activities, a new one brings their past", async () => {
    const { newUser, befriend, friendStore, duel, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");

    duel(alan, grace, 2_000);
    await befriend(ada, alan, 5_000);

    expect((await activityOf(ada.cookie)).map((activity) => activity.at)).toEqual([5_000, 2_000]);

    await friendStore.deleteFriendship(ada.id, alan.id);

    expect(await activityOf(ada.cookie)).toEqual([]);
  });

  test("shows a deleted opponent as nobody", async () => {
    const { newUser, befriend, duel, duels, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");

    await befriend(ada, alan, 1_000);
    duel(alan, grace, 2_000);
    duels.deleteUser(grace.id);

    expect(await activityOf(ada.cookie)).toContainEqual(
      expect.objectContaining({ type: "duel", opponent: null }),
    );
  });

  test(`keeps the last ${ACTIVITY_LIMIT}`, async () => {
    const { newUser, befriend, duel, activityOf } = setup();
    const ada = await newUser("ada");
    const alan = await newUser("alan");
    const grace = await newUser("grace");

    await befriend(ada, alan, 0);

    for (let index = 1; index <= ACTIVITY_LIMIT + 5; index += 1) {
      duel(alan, grace, index * 1_000);
    }

    const activities = await activityOf(ada.cookie);

    expect(activities).toHaveLength(ACTIVITY_LIMIT);
    expect(activities[0]?.at).toBe((ACTIVITY_LIMIT + 5) * 1_000);
    expect(activities.at(-1)?.at).toBe(6_000);
  });
});
