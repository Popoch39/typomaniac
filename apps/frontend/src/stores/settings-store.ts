import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { safeStorage } from "@/lib/safe-storage";

export const durations = [15, 30, 60, 120] as const;

export const wordCounts = [10, 25, 50, 100] as const;

// What is stored, checked on load: a value from an older version or edited by hand is dropped.
const SettingsSchema = Type.Object({
  mode: Type.Union([Type.Literal("time"), Type.Literal("words")]),
  seconds: Type.Union(durations.map((seconds) => Type.Literal(seconds))),
  words: Type.Union(wordCounts.map((words) => Type.Literal(words))),
  language: Type.Union([Type.Literal("fr"), Type.Literal("en")]),
});

// Both counts are kept, so switching Mode back finds the one chosen before.
export type Settings = Static<typeof SettingsSchema>;

type SettingsStore = Settings & {
  setMode: (mode: Settings["mode"]) => void;
  setSeconds: (seconds: Settings["seconds"]) => void;
  setWords: (words: Settings["words"]) => void;
  setLanguage: (language: Settings["language"]) => void;
};

const defaults: Settings = { mode: "time", seconds: 30, words: 10, language: "en" };

// The settings alone, without the actions or anything else stored alongside them.
const settingsOf = ({ mode, seconds, words, language }: Settings): Settings => ({
  mode,
  seconds,
  words,
  language,
});

// The Run settings, a preference of this browser: kept in localStorage, never sent to the server.
// Changing one starts a new Run (see run-store).
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaults,
      setMode: (mode) => set({ mode }),
      setSeconds: (seconds) => set({ seconds }),
      setWords: (words) => set({ words }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "typomaniac-settings",
      version: 1,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: (state) => settingsOf(state),
      // All or nothing: stored settings that do not check out give the defaults back.
      merge: (stored, current) =>
        Value.Check(SettingsSchema, stored) ? { ...current, ...settingsOf(stored) } : current,
    },
  ),
);
