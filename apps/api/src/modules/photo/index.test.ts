import { describe, expect, test } from "bun:test";
import { Value } from "@sinclair/typebox/value";

import { createApp } from "../../app";
import { MeModel } from "../me/model";
import {
  type CookieJar,
  cookieJar,
  createTestAuth,
  memoryPhotoStore,
  signIn,
  testConfig,
} from "../../test-app";

const fixture = (name: string) => Bun.file(new URL(`fixtures/${name}`, import.meta.url));

describe("photo", () => {
  const auth = createTestAuth();
  const photoStore = memoryPhotoStore();
  const app = createApp(testConfig({ auth, photoStore }));

  let users = 0;

  // A new User, signed in, with their provider's image.
  const newUser = async () => {
    users += 1;

    const { user, cookie } = await signIn(auth, {
      name: "Ada",
      email: `user-${users}@example.com`,
      image: "https://avatars.example.com/ada.png",
    });

    return { id: user.id, jar: cookieJar(cookie) };
  };

  const getMe = async (jar: CookieJar) =>
    jar.store(
      await app.handle(
        new Request("http://localhost/api/me", { headers: { cookie: jar.header() } }),
      ),
    );

  const readMe = async (jar: CookieJar) => Value.Parse(MeModel.me, await (await getMe(jar)).json());

  const putPhoto = async (jar: CookieJar, photo: Blob) => {
    const body = new FormData();

    body.append("photo", photo);

    return jar.store(
      await app.handle(
        new Request("http://localhost/api/me/photo", {
          method: "PUT",
          headers: { cookie: jar.header() },
          body,
        }),
      ),
    );
  };

  const deletePhoto = async (jar: CookieJar) =>
    jar.store(
      await app.handle(
        new Request("http://localhost/api/me/photo", {
          method: "DELETE",
          headers: { cookie: jar.header() },
        }),
      ),
    );

  const getPhoto = (url: string) => app.handle(new Request(url));

  test("a Photo sent becomes the Avatar, /me shows it at once, served as a WebP of 512 px", async () => {
    const ada = await newUser();

    // The Session's cookie cache holds the User without a Photo.
    await getMe(ada.jar);

    const response = await putPhoto(ada.jar, fixture("square.png"));

    expect(response.status).toBe(200);

    const me = await readMe(ada.jar);

    expect(me.hasPhoto).toBe(true);
    // Under the User's id: their files are found together.
    expect(me.image).toMatch(
      new RegExp(`^http://localhost/api/photos/${ada.id}/[0-9a-f-]{36}\\.webp$`),
    );

    const served = await getPhoto(me.image ?? "");

    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/webp");
    expect(await new Bun.Image(await served.bytes()).metadata()).toEqual({
      width: 512,
      height: 512,
      format: "webp",
    });
  });

  test("a new Photo replaces the last one, which is erased", async () => {
    const ada = await newUser();

    await putPhoto(ada.jar, fixture("square.png"));
    const first = (await readMe(ada.jar)).image ?? "";

    await putPhoto(ada.jar, fixture("square.jpg"));
    const second = (await readMe(ada.jar)).image ?? "";

    expect(second).not.toBe(first);
    expect((await getPhoto(first)).status).toBe(404);
    expect((await getPhoto(second)).status).toBe(200);
  });

  test("removing the Photo erases it and brings back the provider's image, at once", async () => {
    const ada = await newUser();

    await putPhoto(ada.jar, fixture("square.png"));
    const photo = (await readMe(ada.jar)).image ?? "";

    const response = await deletePhoto(ada.jar);

    expect(response.status).toBe(200);
    expect(await readMe(ada.jar)).toMatchObject({
      hasPhoto: false,
      image: "https://avatars.example.com/ada.png",
    });
    expect((await getPhoto(photo)).status).toBe(404);
  });

  test("removing without a Photo changes nothing", async () => {
    const ada = await newUser();

    expect((await deletePhoto(ada.jar)).status).toBe(200);
    expect(await readMe(ada.jar)).toMatchObject({ hasPhoto: false });
  });

  test("a Photo is served to anyone, without a Session, kept for a year", async () => {
    const ada = await newUser();

    await putPhoto(ada.jar, fixture("square.png"));

    const served = await getPhoto((await readMe(ada.jar)).image ?? "");

    expect(served.status).toBe(200);
    expect(served.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    // Read by the front, on another subdomain of the same site.
    expect(served.headers.get("cross-origin-resource-policy")).toBe("same-site");
  });

  test("an unknown or malformed key finds no Photo", async () => {
    const unknown = `http://localhost/api/photos/someone/${crypto.randomUUID()}.webp`;

    expect((await getPhoto(unknown)).status).toBe(404);
    expect((await getPhoto("http://localhost/api/photos/someone/..%2Fsecret")).status).toBe(422);
    expect((await getPhoto("http://localhost/api/photos/..%2F/photo.webp")).status).toBe(422);
  });

  test("sending or removing a Photo needs a Session", async () => {
    const anonymous = cookieJar("");

    expect((await putPhoto(anonymous, fixture("square.png"))).status).toBe(401);
    expect((await deletePhoto(anonymous)).status).toBe(401);
  });

  test("without a storage, no Photo is sent nor served", async () => {
    const bare = createApp(testConfig({ auth, photoStore: null }));
    const ada = await newUser();
    const body = new FormData();

    body.append("photo", fixture("square.png"));

    const sent = await bare.handle(
      new Request("http://localhost/api/me/photo", {
        method: "PUT",
        headers: { cookie: ada.jar.header() },
        body,
      }),
    );

    expect(sent.status).toBe(503);
    expect(await sent.json()).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
    expect(
      (
        await bare.handle(
          new Request(`http://localhost/api/photos/${ada.id}/${crypto.randomUUID()}.webp`),
        )
      ).status,
    ).toBe(404);
  });

  test("a User sends a few Photos at most per window, each User their own", async () => {
    const limited = createApp(
      testConfig({ auth, photoRateLimit: { max: 2, windowMs: 60 * 60_000 } }),
    );

    const send = (jar: CookieJar) => {
      const body = new FormData();

      body.append("photo", fixture("square.png"));

      return limited.handle(
        new Request("http://localhost/api/me/photo", {
          method: "PUT",
          headers: { cookie: jar.header() },
          body,
        }),
      );
    };

    const ada = await newUser();
    const alan = await newUser();

    expect((await send(ada.jar)).status).toBe(200);
    expect((await send(ada.jar)).status).toBe(200);
    expect((await send(ada.jar)).status).toBe(429);
    expect((await send(alan.jar)).status).toBe(200);
  });

  test("the other Users see the Photo as the Avatar, on the Profile and in the search", async () => {
    const ada = await signIn(auth, {
      name: "Ada",
      email: "ada-seen@example.com",
      image: "https://avatars.example.com/ada.png",
      handle: "ada_seen",
    });

    const alan = await signIn(auth, {
      name: "Alan",
      email: "alan-sees@example.com",
      handle: "alan_sees",
    });

    const read = async (path: string) =>
      (
        await app.handle(
          new Request(`http://localhost/api${path}`, { headers: { cookie: alan.cookie } }),
        )
      ).json();

    await putPhoto(cookieJar(ada.cookie), fixture("square.png"));

    const [photo = ""] = photoStore.keys().toReversed();
    const avatar = `http://localhost/api/photos/${photo}`;

    expect(await read("/users/ada_seen/profile")).toMatchObject({ image: avatar });
    expect(await read("/users/search?handle=ada_se")).toMatchObject([{ image: avatar }]);
  });

  test("a deleted User takes their Photo with them", async () => {
    const store = memoryPhotoStore();
    const ownAuth = createTestAuth({ photoStore: store });
    const own = createApp(testConfig({ auth: ownAuth, photoStore: store }));
    const ada = await signIn(ownAuth, { name: "Ada", email: "ada-gone@example.com" });
    const body = new FormData();

    body.append("photo", fixture("square.png"));
    await own.handle(
      new Request("http://localhost/api/me/photo", {
        method: "PUT",
        headers: { cookie: ada.cookie },
        body,
      }),
    );

    expect(store.keys()).toHaveLength(1);

    await (await ownAuth.$context).internalAdapter.deleteUser(ada.user.id);

    expect(store.keys()).toEqual([]);
  });

  test("a JPEG is taken too", async () => {
    const ada = await newUser();

    expect((await putPhoto(ada.jar, fixture("square.jpg"))).status).toBe(200);
  });

  test("refuses anything but a square JPEG, PNG or WebP of 128 to 1024 px, with the reason, and keeps nothing", async () => {
    const ada = await newUser();
    const kept = photoStore.keys();

    const refusals = [
      { photo: new Blob([crypto.getRandomValues(new Uint8Array(512))]), reason: "not-an-image" },
      { photo: fixture("square.gif"), reason: "not-an-image" },
      { photo: fixture("wide.png"), reason: "not-square" },
      { photo: fixture("tiny.png"), reason: "too-small" },
      { photo: fixture("huge.png"), reason: "too-large" },
    ];

    const responses = await Promise.all(
      refusals.map(async ({ photo }) => {
        const response = await putPhoto(ada.jar, photo);

        return { status: response.status, body: await response.json() };
      }),
    );

    expect(responses).toMatchObject(
      refusals.map(({ reason }) => ({
        status: 422,
        body: {
          error: { code: "VALIDATION_FAILED", details: [{ path: "/photo", message: reason }] },
        },
      })),
    );

    expect(photoStore.keys()).toEqual(kept);
    expect(await readMe(ada.jar)).toMatchObject({
      hasPhoto: false,
      image: "https://avatars.example.com/ada.png",
    });
  });
});
