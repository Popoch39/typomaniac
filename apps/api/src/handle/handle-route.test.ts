import { describe, expect, test } from "bun:test";

import { createApp } from "../app";
import { createTestAuth, signIn, testConfig, testUsers } from "../test-app";

// The cookies a browser holds: each Set-Cookie of a response replaces the one of the same name.
const cookieJar = (initial: string) => {
  const cookies = new Map(
    initial.split("; ").map((cookie) => {
      const [name = "", ...value] = cookie.split("=");

      return [name, value.join("=")];
    }),
  );

  const store = (response: Response) => {
    for (const cookie of response.headers.getSetCookie()) {
      const [pair = ""] = cookie.split(";");
      const [name = "", ...value] = pair.split("=");

      cookies.set(name, value.join("="));
    }

    return response;
  };

  const header = () => [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");

  return { store, header };
};

describe("handle", () => {
  const auth = createTestAuth();
  const app = createApp(testConfig({ auth }));

  let users = 0;

  // A new User, signed in, without a Handle yet.
  const newUser = async (name = "Ada") => {
    users += 1;

    const { user, cookie } = await signIn(auth, { name, email: `user-${users}@example.com` });

    return { id: user.id, jar: cookieJar(cookie) };
  };

  const getMe = async (jar: ReturnType<typeof cookieJar>) =>
    jar.store(
      await app.handle(
        new Request("http://localhost/api/me", { headers: { cookie: jar.header() } }),
      ),
    );

  const availability = async (jar: ReturnType<typeof cookieJar> | null, handle: string) =>
    app.handle(
      new Request(
        `http://localhost/api/handles/availability?handle=${encodeURIComponent(handle)}`,
        { headers: jar ? { cookie: jar.header() } : {} },
      ),
    );

  const putHandle = async (jar: ReturnType<typeof cookieJar> | null, handle: string) => {
    const headers = new Headers({ "content-type": "application/json" });

    if (jar) {
      headers.set("cookie", jar.header());
    }

    const response = await app.handle(
      new Request("http://localhost/api/me/handle", {
        method: "PUT",
        headers,
        body: JSON.stringify({ handle }),
      }),
    );

    return jar ? jar.store(response) : response;
  };

  test("a new User has no Handle yet", async () => {
    const ada = await newUser();

    expect(await (await getMe(ada.jar)).json()).toMatchObject({ handle: null });
  });

  test("both routes need a Session", async () => {
    const responses = await Promise.all([availability(null, "ada"), putHandle(null, "ada")]);

    expect(responses.map((response) => response.status)).toEqual([401, 401]);
  });

  test("a free Handle is available, lowercased", async () => {
    const ada = await newUser();

    const response = await availability(ada.jar, "Free_Handle");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ available: true, handle: "free_handle" });
  });

  test("tells why a Handle is refused", async () => {
    const ada = await newUser();

    const reasons = await Promise.all(
      ["ab", "a".repeat(21), "a".repeat(500), "ada lovelace", "admin"].map(async (handle) =>
        (await availability(ada.jar, handle)).json(),
      ),
    );

    expect(reasons).toEqual([
      { available: false, reason: "too-short" },
      { available: false, reason: "too-long" },
      { available: false, reason: "too-long" },
      { available: false, reason: "invalid-chars" },
      { available: false, reason: "reserved" },
    ]);
  });

  test("setting a Handle stores it lowercased, and /me shows it at once", async () => {
    const ada = await newUser();

    // The Session's cookie cache holds the User without a Handle.
    await getMe(ada.jar);

    const response = await putHandle(ada.jar, "Ada_Lovelace");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: ada.id, handle: "ada_lovelace" });
    expect(await (await getMe(ada.jar)).json()).toMatchObject({ handle: "ada_lovelace" });
  });

  test("an invalid Handle is refused with its reason, and not stored", async () => {
    const ada = await newUser();

    const response = await putHandle(ada.jar, "a!");

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: {
        code: "VALIDATION_FAILED",
        details: [{ path: "/handle", message: "invalid-chars" }],
      },
    });
    expect(await (await getMe(ada.jar)).json()).toMatchObject({ handle: null });
  });

  test("a Handle taken by another User is refused, whatever its case", async () => {
    const ada = await newUser();
    const alan = await newUser("Alan");

    await putHandle(ada.jar, "turing_fan");

    expect(await (await availability(alan.jar, "TURING_FAN")).json()).toEqual({
      available: false,
      reason: "taken",
    });

    const response = await putHandle(alan.jar, "Turing_Fan");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "CONFLICT", details: [{ path: "/handle", message: "taken" }] },
    });
  });

  test("a User's own Handle is available to them", async () => {
    const ada = await newUser();

    await putHandle(ada.jar, "ada_own");

    expect(await (await availability(ada.jar, "ada_own")).json()).toEqual({
      available: true,
      handle: "ada_own",
    });
    expect((await putHandle(ada.jar, "ADA_OWN")).status).toBe(200);
  });

  test("changing Handle frees the previous one at once", async () => {
    const ada = await newUser();
    const alan = await newUser("Alan");

    await putHandle(ada.jar, "first_pick");
    await putHandle(ada.jar, "second_pick");

    expect(await (await getMe(ada.jar)).json()).toMatchObject({ handle: "second_pick" });
    expect((await putHandle(alan.jar, "first_pick")).status).toBe(200);
  });

  test("a Handle taken in the meantime answers the conflict, not a 500", async () => {
    const raceAuth = createTestAuth();
    const real = testUsers(raceAuth);
    const { user: alan } = await signIn(raceAuth, { name: "Alan", email: "alan@example.com" });
    const { cookie } = await signIn(raceAuth, { name: "Ada", email: "ada@example.com" });

    // Alan's write lands between Ada's check and hers: the unique constraint refuses hers.
    const racing = createApp(
      testConfig({
        auth: raceAuth,
        users: {
          ...real,
          setHandle: async (_userId, handle) => {
            await real.setHandle(alan.id, handle);

            throw new Error('duplicate key value violates unique constraint "user_handle_unique"');
          },
        },
      }),
    );

    const response = await racing.handle(
      new Request("http://localhost/api/me/handle", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ handle: "contested" }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "CONFLICT", details: [{ path: "/handle", message: "taken" }] },
    });
  });
});
