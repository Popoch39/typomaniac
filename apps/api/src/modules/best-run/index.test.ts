import { describe, expect, test } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { currentWordListVersion, generateText, type Keystroke } from "typing-engine";

import { createApp } from "../../app";
import { createTestAuth, memoryBestRunStore, signIn, testConfig } from "../../test-app";
import { BestRunModel } from "./model";

const bestRunResponse = TypeCompiler.Compile(BestRunModel.bestRun);

const bestRunOfSetting = TypeCompiler.Compile(BestRunModel.bestRunOfSetting);

const VERSION = currentWordListVersion.en;

// What a client sends, loose enough to send what the API refuses too.
type SentRun = {
  mode: string;
  length: number;
  language: string;
  seed: number;
  wordListVersion: number;
  keystrokes: Keystroke[];
  // Never part of what the client sends: the server computes it.
  wpm?: number;
};

// The first `words` words of the Seed's English Text typed without a mistake, one char every
// `msPerChar` ms from 0, each word followed by its space but the last one when `lastSpace` is false.
const typed = (seed: number, words: number, msPerChar: number, { lastSpace = true } = {}) => {
  const text = generateText(seed, "en", VERSION, words).join(" ");
  const chars = lastSpace ? `${text} ` : text;

  return [...chars].map((char, index): Keystroke => ({
    kind: "char",
    char,
    at: index * msPerChar,
  }));
};

// A flawless `words` Run: every char it typed is right, over the time up to its last Keystroke.
const flawlessWpm = (keystrokes: readonly Keystroke[]) =>
  keystrokes.length / 5 / ((keystrokes.at(-1)?.at ?? 0) / 60_000);

// A `words` Run of 10 words on Seed 7, typed without a mistake, one char every `msPerChar` ms.
const wordsRun = (msPerChar: number, overrides: Partial<SentRun> = {}): SentRun => ({
  mode: "words",
  length: 10,
  language: "en",
  seed: 7,
  wordListVersion: VERSION,
  keystrokes: typed(7, 10, msPerChar, { lastSpace: false }),
  ...overrides,
});

// A `time` Run of 15 s on Seed 7.
const timeRun = (keystrokes: Keystroke[], overrides: Partial<SentRun> = {}): SentRun => ({
  mode: "time",
  length: 15,
  language: "en",
  seed: 7,
  wordListVersion: VERSION,
  keystrokes,
  ...overrides,
});

const headersOf = (cookie: string | null) => {
  const headers = new Headers({ "content-type": "application/json" });

  if (cookie !== null) {
    headers.set("cookie", cookie);
  }

  return headers;
};

const sentRunBody = async (response: Response) => {
  expect(response.status).toBe(200);

  const body = await response.json();

  if (!bestRunResponse.Check(body)) {
    throw new Error(`Not a Best Run: ${JSON.stringify(body)}`);
  }

  return body;
};

const bestRunBody = async (response: Response) => {
  expect(response.status).toBe(200);

  const body = await response.json();

  if (!bestRunOfSetting.Check(body)) {
    throw new Error(`Not the Best Run of a setting: ${JSON.stringify(body)}`);
  }

  return body.bestRun;
};

// A fresh app per test: its Users and its Best Runs are its own.
const setup = () => {
  const auth = createTestAuth();
  const app = createApp(testConfig({ auth, bestRunStore: memoryBestRunStore() }));

  let users = 0;

  const post = (cookie: string | null, run: Partial<SentRun>) =>
    app.handle(
      new Request("http://localhost/api/runs", {
        method: "POST",
        headers: headersOf(cookie),
        body: JSON.stringify(run),
      }),
    );

  const read = (cookie: string | null, path: string) =>
    app.handle(new Request(`http://localhost/api${path}`, { headers: headersOf(cookie) }));

  const get = (cookie: string | null, query: string) => read(cookie, `/runs/best?${query}`);

  const newUser = async () => {
    users += 1;

    const { cookie } = await signIn(auth, {
      name: `User ${users}`,
      email: `user-${users}@example.com`,
      handle: `user${users}`,
    });

    return {
      cookie,
      send: async (run: SentRun) => sentRunBody(await post(cookie, run)),
      best: async (query: string) => bestRunBody(await get(cookie, query)),
    };
  };

  return { post, get, read, newUser };
};

describe("POST /api/runs", () => {
  test("a first Run becomes the Best Run of its setting, its wpm computed by the server", async () => {
    const { newUser } = setup();
    const ada = await newUser();
    const run = wordsRun(100);

    expect(await ada.send(run)).toEqual({
      seed: 7,
      wordListVersion: VERSION,
      keystrokes: run.keystrokes,
      wpm: expect.closeTo(flawlessWpm(run.keystrokes), 6),
    });
  });

  test("a faster Run of the setting replaces its Best Run", async () => {
    const { newUser } = setup();
    const ada = await newUser();
    const faster = wordsRun(80, { seed: 7 });

    await ada.send(wordsRun(100));

    expect(await ada.send(faster)).toMatchObject({ keystrokes: faster.keystrokes });
    expect(await ada.best("mode=words&length=10&language=en")).toMatchObject({
      keystrokes: faster.keystrokes,
    });
  });

  test("a slower Run leaves the Best Run as it was", async () => {
    const { newUser } = setup();
    const ada = await newUser();
    const first = wordsRun(100);

    await ada.send(first);

    expect(await ada.send(wordsRun(150))).toMatchObject({ keystrokes: first.keystrokes });
  });

  // A `time` Run's wpm only counts its right chars over its time: typed faster, the same words
  // make the same wpm.
  test("a Run exactly as fast leaves the Best Run as it was", async () => {
    const { newUser } = setup();
    const ada = await newUser();
    const first = timeRun(typed(7, 10, 100));

    const kept = await ada.send(first);

    expect(await ada.send(timeRun(typed(7, 10, 50)))).toEqual(kept);
    expect(kept.keystrokes).toEqual(first.keystrokes);
  });

  test("a wpm sent by the client is never read", async () => {
    const { newUser } = setup();
    const ada = await newUser();
    const run = wordsRun(100);

    await ada.send(run);

    expect(await ada.send({ ...wordsRun(200), wpm: 500 })).toMatchObject({
      keystrokes: run.keystrokes,
      wpm: expect.closeTo(flawlessWpm(run.keystrokes), 6),
    });
  });

  test("refuses a Run without a Session", async () => {
    const { post } = setup();

    expect((await post(null, wordsRun(100))).status).toBe(401);
  });

  test("refuses a length the app does not offer", async () => {
    const { post, newUser } = setup();
    const ada = await newUser();

    const statuses = await Promise.all(
      [
        wordsRun(100, { length: 20 }),
        timeRun(typed(7, 5, 100), { length: 45 }),
        timeRun(typed(7, 5, 100), { length: 10 }),
      ].map(async (run) => (await post(ada.cookie, run)).status),
    );

    expect(statuses).toEqual([422, 422, 422]);
  });

  // Each refused Run with the rule it breaks.
  const invalidRuns: [string, SentRun, string][] = [
    [
      "an unknown Word list version",
      wordsRun(100, { wordListVersion: VERSION + 1 }),
      "/wordListVersion",
    ],
    [
      "a `words` Run its Keystrokes do not finish",
      wordsRun(100, { keystrokes: typed(7, 9, 100) }),
      "/keystrokes",
    ],
    [
      "Keystrokes out of order",
      wordsRun(100, { keystrokes: typed(7, 10, 100, { lastSpace: false }).toReversed() }),
      "/keystrokes",
    ],
    [
      "a Run whose first Keystroke is not at its start",
      wordsRun(100, {
        keystrokes: typed(7, 10, 100, { lastSpace: false }).map((key) =>
          Object.assign(key, { at: key.at + 50 }),
        ),
      }),
      "/keystrokes",
    ],
    ["a Keystroke past the end of a `time` Run", timeRun(typed(7, 40, 400)), "/keystrokes"],
    [
      "a Keystroke past the end of a `words` Run",
      wordsRun(100, { keystrokes: typed(7, 10, 100) }),
      "/keystrokes",
    ],
  ];

  test.each(invalidRuns)("refuses %s", async (_, run, path) => {
    const { post, newUser } = setup();
    const ada = await newUser();

    const response = await post(ada.cookie, run);

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_FAILED", details: [{ path }] },
    });
  });
});

describe("a Best Run and the Profile", () => {
  test("leaves the Stats and the Records as they were", async () => {
    const { read, newUser } = setup();
    const ada = await newUser();

    await ada.send(wordsRun(100));

    const response = await read(ada.cookie, "/users/user1/profile");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      stats: {
        duels: 0,
        averages: { wpm: null, accuracy: null },
        records: { wpm: null, score: null, combo: null },
        progression: [],
      },
    });
  });
});

describe("GET /api/runs/best", () => {
  test("null while the setting has no Best Run", async () => {
    const { newUser } = setup();
    const ada = await newUser();

    expect(await ada.best("mode=time&length=30&language=en")).toBeNull();
  });

  test("the Best Run of the setting asked, each Mode, length and Language on its own", async () => {
    const { newUser } = setup();
    const ada = await newUser();
    const alan = await newUser();
    const words = wordsRun(100);
    const time = timeRun(typed(7, 10, 100));

    await ada.send(words);
    await ada.send(time);

    expect(await ada.best("mode=words&length=10&language=en")).toMatchObject({
      keystrokes: words.keystrokes,
    });
    expect(await ada.best("mode=time&length=15&language=en")).toMatchObject({
      keystrokes: time.keystrokes,
    });
    expect(await ada.best("mode=time&length=30&language=en")).toBeNull();
    expect(await ada.best("mode=words&length=25&language=en")).toBeNull();
    expect(await ada.best("mode=words&length=10&language=fr")).toBeNull();
    expect(await alan.best("mode=words&length=10&language=en")).toBeNull();
  });

  test("refuses a setting the app does not offer, or a reader without a Session", async () => {
    const { get, newUser } = setup();
    const ada = await newUser();

    expect((await get(ada.cookie, "mode=words&length=30&language=en")).status).toBe(422);
    expect((await get(ada.cookie, "mode=time&length=10&language=en")).status).toBe(422);
    expect((await get(ada.cookie, "mode=time&length=30&language=de")).status).toBe(422);
    expect((await get(null, "mode=time&length=30&language=en")).status).toBe(401);
  });
});
