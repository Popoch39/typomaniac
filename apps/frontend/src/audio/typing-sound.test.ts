import { type Cue, defaultPace, type Key, type RunConfig } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createAudioEngine } from "@/audio/audio-engine";
import { startSoundReactor } from "@/audio/sound-reactor";
import { useRunStore } from "@/stores/run-store";
import { useSoundStore } from "@/stores/sound-store";
import {
  backspace,
  decoded,
  error,
  fakeOutput,
  key07,
  middle,
  space,
} from "@/test/fake-audio-output";

// Seed 42 in English, version 1, gives "small help while late…" (pinned in the typing-engine tests).
const words10: RunConfig = {
  mode: "words",
  words: 10,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

const char = (c: string): Key => ({ kind: "char", char: c });

// Presses the keys 100 ms apart at the `pace`, the way the typing area does.
const pressAt = (pace: number, keys: Key[]) => {
  for (const [i, key] of keys.entries()) {
    useRunStore.getState().press(key, 1_000 + i * 100, pace);
  }
};

const press = (...keys: Key[]) => pressAt(defaultPace, keys);

const type = (input: string, pace = defaultPace) => pressAt(pace, [...input].map(char));

const kindsOf = (cues: readonly Cue[]) => cues.map((cue) => cue.kind);

let stop = () => {};

// Every test starts on a first visit: default sound settings.
beforeEach(() => {
  localStorage.clear();
  useSoundStore.setState(useSoundStore.getInitialState());
  useRunStore.getState().start(words10);
});

afterEach(() => {
  stop();
});

// Starts the sound on the output, the way the app does at startup, then waits for the pack.
const listen = async (fake = fakeOutput(), random = middle) => {
  stop = startSoundReactor(
    createAudioEngine(() => fake.output),
    { random },
  );
  await decoded();

  return fake;
};

describe("typing sound in a solo Run", () => {
  test("nothing plays before the first key", async () => {
    const { played, state } = await listen();

    expect(played).toEqual([]);
    expect(state.resumed).toBe(0);
  });

  test("a right letter plays a key variant of the tactile pack, at medium volume", async () => {
    const { played, state } = await listen();

    type("s");

    expect(played).toEqual([key07]);
    expect(state.volume).toBe(0.5);
    expect(state.resumed).toBeGreaterThan(0);
  });

  test("two keys in a row draw their variant and their detune at random", async () => {
    const draws = [0, 0, 0.999, 0.999];
    const { played } = await listen(fakeOutput(), () => draws.shift() ?? 0.5);

    type("sm");

    expect(played).toEqual([
      { url: "/sounds/tactile/key-01.mp3", detune: -50, gain: 1 },
      { url: "/sounds/tactile/key-12.mp3", detune: expect.closeTo(50, 0), gain: 1 },
    ]);
  });

  test("a space closing a word plays the space sound", async () => {
    const { played } = await listen();

    type("small ");

    expect(played.at(-1)).toEqual(space);
  });

  test("a mistake plays the key, then the error sound over it", async () => {
    const { played } = await listen();

    type("x");

    expect(played).toEqual([key07, error]);
  });

  test("a backspace plays the backspace sound, deleting a word too", async () => {
    const { played } = await listen();

    type("sm");
    press({ kind: "backspace" }, { kind: "deleteWord" });

    expect(played.slice(2)).toEqual([backspace, backspace]);
  });

  test("a key the engine ignores plays nothing", async () => {
    const { played } = await listen();

    press(char(" "), { kind: "backspace" });

    expect(played).toEqual([]);
  });

  // At 100 ms a char, every word goes at 120 wpm, far above a Pace of 10 wpm: the space after
  // "late", the 4th right word, validates it, raises the Combo to x2 and wins a Burst.
  test("the Cues of the word, the Combo and the Burst play nothing yet", async () => {
    const { played } = await listen();
    const typed = "small help while late ";

    type(typed, 10);

    expect(kindsOf(useRunStore.getState().cues)).toEqual(["hit", "word", "comboUp", "burst"]);
    // One sound per key, none for the word, the Combo nor the Burst.
    expect(played).toHaveLength(typed.length);
    expect(played.at(-1)).toEqual(space);

    press(char("x"));

    expect(kindsOf(useRunStore.getState().cues)).toEqual(["miss", "comboBroken"]);
    expect(played.slice(typed.length)).toEqual([key07, error]);
  });

  test("a sound whose file is not decoded yet is skipped, the Run goes on", async () => {
    const { played } = await listen(fakeOutput({ decodes: false }));

    type("sm");

    expect(played).toEqual([]);
    expect(useRunStore.getState().run.letterIndex).toBe(2);
  });

  test("without Web Audio, the Run goes on in silence", async () => {
    stop = startSoundReactor(
      createAudioEngine(() => null),
      { random: middle },
    );
    await decoded();

    expect(() => type("sm")).not.toThrow();
    expect(useRunStore.getState().run.letterIndex).toBe(2);
  });
});

describe("Sound packs", () => {
  // What each pack plays at mid-range randomness: its middle key, its space, its error, its
  // backspace, at the gains that level it with the others.
  test.each([
    {
      pack: "typewriter",
      key: { url: "/sounds/typewriter/key-02.mp3", detune: 0, gain: 0.55 },
      space: { url: "/sounds/typewriter/key-02.mp3", detune: -300, gain: 0.55 },
      error: { url: "/sounds/typewriter/error.mp3", detune: 0, gain: 0.4 },
      backspace: { url: "/sounds/typewriter/backspace.mp3", detune: 0, gain: 0.75 },
    },
    {
      pack: "office",
      key: { url: "/sounds/office/key-07.mp3", detune: 0, gain: 1 },
      space: { url: "/sounds/office/key-05.mp3", detune: -300, gain: 1 },
      error: { url: "/sounds/office/error.mp3", detune: 0, gain: 0.4 },
      backspace: { url: "/sounds/office/key-09.mp3", detune: -500, gain: 0.8 },
    },
    {
      pack: "keyboard",
      key: { url: "/sounds/keyboard/key-03.mp3", detune: 0, gain: 1.2 },
      space: { url: "/sounds/keyboard/space-02.mp3", detune: 0, gain: 1.2 },
      error: { url: "/sounds/keyboard/error.mp3", detune: 0, gain: 0.45 },
      backspace: { url: "/sounds/keyboard/backspace.mp3", detune: 0, gain: 0.8 },
    },
  ] as const)("the $pack pack plays its own sounds", async (sounds) => {
    useSoundStore.getState().setPack(sounds.pack);

    const { played, loaded } = await listen();

    expect(loaded).toContain(sounds.key.url);

    type("small ");
    type("x");
    press({ kind: "backspace" });

    expect(played).toEqual([
      ...Array.from({ length: 5 }, () => sounds.key),
      sounds.space,
      sounds.key,
      sounds.error,
      sounds.backspace,
    ]);
  });

  test("the keyboard pack draws its space among its two space bars", async () => {
    useSoundStore.getState().setPack("keyboard");

    const { played } = await listen(fakeOutput(), () => 0);

    type("small ");

    expect(played.at(-1)).toEqual({ url: "/sounds/keyboard/space-01.mp3", detune: 0, gain: 1.2 });
  });

  test("the typewriter pack detunes its keys wider", async () => {
    useSoundStore.getState().setPack("typewriter");

    const { played } = await listen(fakeOutput(), () => 0);

    type("s");

    expect(played).toEqual([{ url: "/sounds/typewriter/key-01.mp3", detune: -100, gain: 0.55 }]);
  });
});

describe("sound settings", () => {
  test("off plays no typing sound at all", async () => {
    const { played } = await listen();

    useSoundStore.getState().setPack("off");
    type("sx");
    press({ kind: "backspace" }, char(" "));

    expect(played).toEqual([]);
  });

  test("off stored on a previous visit loads no pack, choosing one loads it at once", async () => {
    useSoundStore.getState().setPack("off");

    const { played, loaded } = await listen();

    expect(loaded).toEqual([]);

    useSoundStore.getState().setPack("tactile");
    await decoded();

    expect(loaded).toContain(key07.url);

    type("s");

    expect(played).toEqual([key07]);
  });

  test("the volume sets the level of every sound, even mid-Run", async () => {
    const { state } = await listen();

    type("sm");
    useSoundStore.getState().setVolume(0.8);

    expect(state.volume).toBe(0.8);
  });

  test("changing the pack or the volume mid-Run does not start a new Run", async () => {
    const { played } = await listen();
    const { runNumber } = useRunStore.getState();

    type("sm");
    useSoundStore.getState().setPack("off");
    useSoundStore.getState().setVolume(0.2);
    useSoundStore.getState().setPack("tactile");
    type("a");

    expect(useRunStore.getState().runNumber).toBe(runNumber);
    expect(useRunStore.getState().run.letterIndex).toBe(3);
    expect(played).toHaveLength(3);
  });
});
