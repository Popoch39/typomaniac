import { describe, expect, test } from "bun:test";

import { applyKeystroke, createRun, isFinished, type RunConfig, type RunState } from "./index";

// Seed 42 in English starts with "small help while" (pinned in text.test.ts).
const config: RunConfig = { mode: "words", words: 3, language: "en", seed: 42 };

// Types each character of `input` as a Keystroke, 100 ms apart.
const type = (state: RunState, input: string) =>
  [...input].reduce(
    (current, char, i): RunState => applyKeystroke(current, { kind: "char", char, at: i * 100 }),
    state,
  );

const statuses = (state: RunState, wordIndex: number) =>
  state.words[wordIndex]?.letters.map((letter) => letter.status);

describe("createRun", () => {
  test("starts on the first letter of the Text, every letter pending", () => {
    const run = createRun(config);

    expect(run.words.map((word) => word.target)).toEqual(["small", "help", "while"]);
    expect(run.wordIndex).toBe(0);
    expect(run.letterIndex).toBe(0);
    expect(run.validatedWords).toBe(0);
    expect(statuses(run, 0)).toEqual(["pending", "pending", "pending", "pending", "pending"]);
  });

  test("words and letters carry their position, extra letters included", () => {
    const run = type(createRun(config), "smallest");

    expect(run.words.map((word) => word.index)).toEqual([0, 1, 2]);
    expect(run.words[0]?.letters.map((letter) => letter.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("applyKeystroke", () => {
  test("a right character is correct, a wrong one incorrect and still shows the expected letter", () => {
    const run = type(createRun(config), "sn");

    expect(statuses(run, 0)).toEqual(["correct", "incorrect", "pending", "pending", "pending"]);
    expect(run.words[0]?.letters[1]?.char).toBe("m");
    expect(run.letterIndex).toBe(2);
  });

  test("space validates the current word and moves to the next one", () => {
    const run = type(createRun(config), "small ");

    expect(run.validatedWords).toBe(1);
    expect(run.wordIndex).toBe(1);
    expect(run.letterIndex).toBe(0);
  });

  test("space validates the current word even when it is wrong", () => {
    const run = type(createRun(config), "smoll ");

    expect(run.validatedWords).toBe(1);
    expect(run.wordIndex).toBe(1);
    expect(statuses(run, 0)).toEqual(["correct", "correct", "incorrect", "correct", "correct"]);
  });

  test("space before the first letter of a word is ignored", () => {
    const run = type(createRun(config), " small  ");

    expect(run.validatedWords).toBe(1);
    expect(run.wordIndex).toBe(1);
    expect(statuses(run, 0)?.every((status) => status === "correct")).toBe(true);
  });

  test("letters typed past the end of a word are extra", () => {
    const run = type(createRun(config), "smallest");

    expect(statuses(run, 0)).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "extra",
      "extra",
      "extra",
    ]);
    expect(run.words[0]?.letters.slice(5).map((letter) => letter.char)).toEqual(["e", "s", "t"]);
  });
});

describe("isFinished in words Mode", () => {
  test("not while words are left", () => {
    expect(isFinished(createRun(config))).toBe(false);
    expect(isFinished(type(createRun(config), "small help whil"))).toBe(false);
  });

  test("as soon as the last word is typed right, without space", () => {
    const run = type(createRun(config), "small help while");

    expect(isFinished(run)).toBe(true);
    expect(run.validatedWords).toBe(3);
  });

  test("a wrong last word only ends the Run on space", () => {
    const wrong = type(createRun(config), "small help whale");

    expect(isFinished(wrong)).toBe(false);

    const run = type(wrong, " ");

    expect(isFinished(run)).toBe(true);
    expect(run.validatedWords).toBe(3);
  });

  test("Keystrokes after the end change nothing", () => {
    const run = type(createRun(config), "small help while");

    expect(type(run, "s d")).toEqual(run);
  });
});
