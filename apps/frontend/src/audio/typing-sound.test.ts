import { type Cue, defaultPace, type Key, type RunConfig } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { type AudioOutput, createAudioEngine } from "@/audio/audio-engine";
import { startSoundReactor } from "@/audio/sound-reactor";
import { useRunStore } from "@/stores/run-store";

// Seed 42 in English, version 1, gives "small help while late…" (pinned in the typing-engine tests).
const words10: RunConfig = {
  mode: "words",
  words: 10,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

type Played = { url: string; detune: number; gain: number };

// An audio output that decodes every file at once, or never, and writes down what it plays.
const fakeOutput = ({ decodes = true } = {}) => {
  const played: Played[] = [];
  const state = { volume: 1, resumed: 0 };

  const output: AudioOutput<string> = {
    decode: (url) => (decodes ? Promise.resolve(url) : new Promise<string>(() => {})),
    play: (url, playback) => {
      played.push({ url, ...playback });
    },
    resume: () => {
      state.resumed++;
    },
    setVolume: (volume) => {
      state.volume = volume;
    },
  };

  return { output, played, state };
};

// The decoding of the pack is asynchronous: lets it settle before typing.
const decoded = () => new Promise((resolve) => setTimeout(resolve, 0));

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

// Mid-range randomness: the 7th of the 12 key variants, not detuned.
const middle = () => 0.5;

const key07 = { url: "/sounds/tactile/key-07.mp3", detune: 0, gain: 1 };

const space = { url: "/sounds/tactile/key-05.mp3", detune: -300, gain: 1 };

const error = { url: "/sounds/tactile/error.mp3", detune: 0, gain: 0.5 };

let stop = () => {};

beforeEach(() => {
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

    expect(played.slice(2)).toEqual([
      { url: "/sounds/tactile/backspace.mp3", detune: 0, gain: 0.9 },
      { url: "/sounds/tactile/backspace.mp3", detune: 0, gain: 0.9 },
    ]);
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
