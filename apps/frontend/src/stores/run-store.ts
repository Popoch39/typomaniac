import {
  applyKeystroke,
  computeResult,
  createRun,
  isFinished,
  type Key,
  type Keystroke,
  type Result,
  type RunConfig,
  type RunState,
} from "typing-engine";
import { create } from "zustand";

type RunStore = {
  run: RunState;
  keystrokes: readonly Keystroke[];
  // Clock reading of the first Keystroke: every `at` is relative to it.
  startedAt: number | null;
  result: Result | null;
  start: (config: RunConfig) => void;
  press: (key: Key, now: number) => void;
  // Ends a `time` Run once its time is up, even when no key is pressed. Called on every frame.
  tick: (now: number) => void;
};

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

// `time` 30 until the settings exist (#12).
const defaultConfig = (): RunConfig => ({
  mode: "time",
  seconds: 30,
  language: "en",
  seed: randomSeed(),
});

const freshRun = (config: RunConfig) => ({
  run: createRun(config),
  keystrokes: [],
  startedAt: null,
  result: null,
});

// The Result once the Run is finished, `at` milliseconds after its start.
const resultAt = (run: RunState, keystrokes: readonly Keystroke[], at: number) =>
  isFinished(run, at) ? computeResult(run.config, keystrokes, at) : null;

// Holds the Run in progress and hands every rule to typing-engine (ADR 0002).
export const useRunStore = create<RunStore>()((set) => ({
  ...freshRun(defaultConfig()),
  start: (config) => set(freshRun(config)),
  press: (key, now) =>
    set((state) => {
      if (state.result !== null) {
        return state;
      }

      const startedAt = state.startedAt ?? now;
      const keystroke: Keystroke = { ...key, at: now - startedAt };
      const keystrokes = [...state.keystrokes, keystroke];
      const run = applyKeystroke(state.run, keystroke);

      return { run, keystrokes, startedAt, result: resultAt(run, keystrokes, keystroke.at) };
    }),
  tick: (now) =>
    set((state) => {
      if (state.startedAt === null || state.result !== null) {
        return state;
      }

      const result = resultAt(state.run, state.keystrokes, now - state.startedAt);

      return result === null ? state : { result };
    }),
}));
