import {
  applyKeystroke,
  computeResult,
  createRun,
  isFinished,
  type Key,
  type Keystroke,
  type Result,
  type RunState,
} from "typing-engine";
import { create } from "zustand";

type RunStore = {
  run: RunState;
  keystrokes: readonly Keystroke[];
  // Clock reading of the first Keystroke: every `at` is relative to it.
  startedAt: number | null;
  result: Result | null;
  start: (seed: number) => void;
  press: (key: Key, now: number) => void;
};

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

const freshRun = (seed: number) => ({
  run: createRun({ mode: "words", words: 10, language: "en", seed }),
  keystrokes: [],
  startedAt: null,
  result: null,
});

// Holds the Run in progress and hands every rule to typing-engine (ADR 0002).
export const useRunStore = create<RunStore>()((set) => ({
  ...freshRun(randomSeed()),
  start: (seed) => set(freshRun(seed)),
  press: (key, now) =>
    set((state) => {
      if (isFinished(state.run)) {
        return state;
      }

      const startedAt = state.startedAt ?? now;
      const keystroke: Keystroke = { ...key, at: now - startedAt };
      const keystrokes = [...state.keystrokes, keystroke];
      const run = applyKeystroke(state.run, keystroke);

      return {
        run,
        keystrokes,
        startedAt,
        result: isFinished(run) ? computeResult(run.config, keystrokes, keystroke.at) : null,
      };
    }),
}));
