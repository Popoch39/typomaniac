import { applyKeystroke, createRun, type Keystroke, type RunConfig } from "typing-engine";

// How many words of the Text the excerpt draws at most: more than a tall card holds.
export const EXCERPT_WORDS = 60;

// The glimpse's caret goes on alone at one key every 250 ms, some 48 wpm.
const GLIMPSE_KEY_MS = 250;

// How many of the Keystrokes type the excerpt's first `words` words: up to the one that validates
// the last of them, or all of them when the Run ends before.
export const excerptLength = (
  config: RunConfig,
  keystrokes: readonly Keystroke[],
  words: number,
) => {
  if (words === 0) {
    return 0;
  }

  let run = createRun(config);

  for (const [index, keystroke] of keystrokes.entries()) {
    run = applyKeystroke(run, keystroke);

    if (run.validatedWords >= words) {
      return index + 1;
    }
  }

  return keystrokes.length;
};

// The glimpse of each Text drawn, kept while its config lives: the same Keystrokes on every
// render, so the timeline that plays them never starts over for a new array.
const glimpses = new WeakMap<RunConfig, readonly Keystroke[]>();

// The Text's first words typed right, each followed by its space, at the glimpse's pace: what moves
// its caret on alone.
export const glimpseKeystrokes = (config: RunConfig): readonly Keystroke[] => {
  const known = glimpses.get(config);

  if (known !== undefined) {
    return known;
  }

  const keystrokes = [
    ...createRun(config)
      .words.slice(0, EXCERPT_WORDS)
      .map((word) => `${word.target} `)
      .join(""),
  ].map((char, index): Keystroke => ({ kind: "char", char, at: index * GLIMPSE_KEY_MS }));

  glimpses.set(config, keystrokes);

  return keystrokes;
};
