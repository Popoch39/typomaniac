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

import { type Settings, useSettingsStore } from "@/stores/settings-store";

type RunStore = {
  run: RunState;
  keystrokes: readonly Keystroke[];
  // Clock reading of the first Keystroke: every `at` is relative to it.
  startedAt: number | null;
  result: Result | null;
  // Counts the Runs started: a new one remounts the typing area, fresh state and focus included.
  runNumber: number;
  start: (config: RunConfig) => void;
  // Suivant: a new Run with a new Seed, the rest of the config kept.
  next: () => void;
  // Rejouer: the same Seed, so exactly the same Text.
  replay: () => void;
  press: (key: Key, now: number) => void;
  // Ends a `time` Run once its time is up, even when no key is pressed. Called on every frame.
  tick: (now: number) => void;
};

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

// A Run on the settings, with a new Seed.
const configFrom = ({ mode, seconds, words, language }: Settings): RunConfig =>
  mode === "time"
    ? { mode, seconds, language, seed: randomSeed() }
    : { mode, words, language, seed: randomSeed() };

const freshRun = (config: RunConfig) => ({
  run: createRun(config),
  keystrokes: [],
  startedAt: null,
  result: null,
});

const newRun = (state: RunStore, config: RunConfig) => ({
  ...freshRun(config),
  runNumber: state.runNumber + 1,
});

// The Result once the Run is finished, `at` milliseconds after its start.
const resultAt = (run: RunState, keystrokes: readonly Keystroke[], at: number) =>
  isFinished(run, at) ? computeResult(run.config, keystrokes, at) : null;

// Holds the Run in progress and hands every rule to typing-engine (ADR 0002).
export const useRunStore = create<RunStore>()((set) => ({
  ...freshRun(configFrom(useSettingsStore.getState())),
  runNumber: 0,
  start: (config) => set((state) => newRun(state, config)),
  next: () => set((state) => newRun(state, { ...state.run.config, seed: randomSeed() })),
  replay: () => set((state) => newRun(state, state.run.config)),
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

const sameSettings = (a: Settings, b: Settings) =>
  a.mode === b.mode && a.seconds === b.seconds && a.words === b.words && a.language === b.language;

// Changing a setting, or restoring the stored ones, starts a new Run: the Text always matches the
// settings shown.
useSettingsStore.subscribe((settings, previous) => {
  if (!sameSettings(settings, previous)) {
    useRunStore.getState().start(configFrom(settings));
  }
});
