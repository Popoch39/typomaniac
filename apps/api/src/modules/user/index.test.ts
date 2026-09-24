import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

import { createApp } from "../../app";
import { createTestAuth, signIn, testConfig } from "../../test-app";

const usersFound = TypeCompiler.Compile(t.Array(t.Object({ handle: t.String() })));

// A fresh app per test: its Users and its search counters are its own.
const setup = ({ searchRateLimit = { max: 1000, windowMs: 60_000 } } = {}) => {
  const auth = createTestAuth();
  const app = createApp(testConfig({ auth, searchRateLimit }));

  let users = 0;

  const newUser = async (handle?: string) => {
    users += 1;

    const { user, cookie } = await signIn(auth, {
      name: `User ${users}`,
      email: `user-${users}@example.com`,
      image: `https://example.com/${users}.png`,
      handle,
    });

    return { id: user.id, cookie };
  };

  const search = async (cookie: string | null, handle: string) =>
    app.handle(
      new Request(`http://localhost/api/users/search?handle=${encodeURIComponent(handle)}`, {
        headers: cookie === null ? {} : { cookie },
      }),
    );

  const handlesFound = async (cookie: string, handle: string) => {
    const response = await search(cookie, handle);

    expect(response.status).toBe(200);

    return usersFound.Decode(await response.json()).map((result) => result.handle);
  };

  return { newUser, search, handlesFound };
};

describe("user search", () => {
  test("needs a Session", async () => {
    const { search } = setup();

    expect((await search(null, "ada")).status).toBe(401);
  });

  test("needs a Handle", async () => {
    const { newUser, search } = setup();
    const visitor = await newUser();

    const response = await search(visitor.cookie, "ada");

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  test("refuses fewer than 2 characters", async () => {
    const { newUser, search } = setup();
    const me = await newUser("me_myself");

    const responses = await Promise.all([search(me.cookie, ""), search(me.cookie, "a")]);

    expect(responses.map((response) => response.status)).toEqual([422, 422]);
  });

  test("finds the Users whose Handle starts with the prefix, whatever its case", async () => {
    const { newUser, handlesFound } = setup();
    const me = await newUser("me_myself");

    await newUser("ada");
    await newUser("adam");
    await newUser("madame");
    await newUser("alan");

    expect(await handlesFound(me.cookie, "AD")).toEqual(["ada", "adam"]);
  });

  test("puts the exact Handle first, then the others in alphabetical order", async () => {
    const { newUser, handlesFound } = setup();
    const me = await newUser("me_myself");

    await Promise.all(["pop_2", "popoch_z", "popoch", "popoch_a", "pop1"].map(newUser));

    expect(await handlesFound(me.cookie, "popoch")).toEqual(["popoch", "popoch_a", "popoch_z"]);
    expect(await handlesFound(me.cookie, "pop")).toEqual([
      "pop1",
      "pop_2",
      "popoch",
      "popoch_a",
      "popoch_z",
    ]);
  });

  test("takes an underscore as itself", async () => {
    const { newUser, handlesFound } = setup();
    const me = await newUser("me_myself");

    await newUser("ab_c");
    await newUser("abxc");

    expect(await handlesFound(me.cookie, "ab_")).toEqual(["ab_c"]);
  });

  test("gives at most 10 results", async () => {
    const { newUser, handlesFound } = setup();
    const me = await newUser("me_myself");

    await Promise.all(Array.from({ length: 12 }, (_, index) => newUser(`many_${index + 10}`)));

    const found = await handlesFound(me.cookie, "many");

    expect(found).toHaveLength(10);
    expect(found.at(0)).toBe("many_10");
    expect(found.at(-1)).toBe("many_19");
  });

  test("never finds the searching User, nor the Users without a Handle", async () => {
    const { newUser, handlesFound } = setup();
    const me = await newUser("twin_me");

    await newUser();
    await newUser("twin_you");

    expect(await handlesFound(me.cookie, "twin")).toEqual(["twin_you"]);
  });

  test("finds nothing for characters no Handle holds", async () => {
    const { newUser, handlesFound } = setup();
    const me = await newUser("me_myself");

    await newUser("ada");

    expect(await handlesFound(me.cookie, "a%")).toEqual([]);
    expect(await handlesFound(me.cookie, "a".repeat(40))).toEqual([]);
  });

  test("shows the id, the Handle, the avatar and the relation, never the name nor the email", async () => {
    const { newUser, search } = setup();
    const me = await newUser("me_myself");
    const ada = await newUser("ada");

    const response = await search(me.cookie, "ada");

    expect(await response.json()).toEqual([
      { id: ada.id, handle: "ada", image: "https://example.com/2.png", relation: "none" },
    ]);
  });

  test("is limited per User, more strictly than the rest of the API", async () => {
    const { newUser, search } = setup({ searchRateLimit: { max: 2, windowMs: 60_000 } });
    const me = await newUser("me_myself");
    const other = await newUser("other_one");

    const allowed = await Promise.all([search(me.cookie, "ada"), search(me.cookie, "ada")]);
    const limited = await search(me.cookie, "ada");

    expect(allowed.map((response) => response.status)).toEqual([200, 200]);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).not.toBeNull();
    expect(await limited.json()).toMatchObject({ error: { code: "TOO_MANY_REQUESTS" } });
    expect((await search(other.cookie, "ada")).status).toBe(200);
  });
});
