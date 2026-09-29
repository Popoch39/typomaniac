import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { Language } from "typing-engine";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { safeStorage } from "@/lib/safe-storage";
import type { Locale } from "@/locale/locales";

export const durations = [15, 30, 60, 120] as const;

export const wordCounts = [10, 25, 50, 100] as const;

const LanguageSchema = Type.Union([Type.Literal("fr"), Type.Literal("en")]);

const modeFields = {
  mode: Type.Union([Type.Literal("time"), Type.Literal("words")]),
  seconds: Type.Union(durations.map((seconds) => Type.Literal(seconds))),
  words: Type.Union(wordCounts.map((words) => Type.Literal(words))),
};

// What is stored, checked on load: a value edited by hand is dropped. The Language is null, absent,
// until one is chosen: the Runs are then drawn in the Locale.
const SettingsSchema = Type.Object({
  ...modeFields,
  language: Type.Union([LanguageSchema, Type.Null()]),
});

// What version 1 stored: the Language always there, English until another was chosen.
const Version1SettingsSchema = Type.Object({ ...modeFields, language: LanguageSchema });

// Both counts are kept, so switching Mode back finds the one chosen before.
export type Settings = Static<typeof SettingsSchema>;

type SettingsStore = Settings & {
  setMode: (mode: Settings["mode"]) => void;
  setSeconds: (seconds: Settings["seconds"]) => void;
  setWords: (words: Settings["words"]) => void;
  setLanguage: (language: Language) => void;
};

const defaults: Settings = { mode: "time", seconds: 30, words: 10, language: null };

// The Language of each Locale's Runs, until one is chosen.
const LOCALE_LANGUAGES: Record<Locale, Language> = { fr: "fr", en: "en" };

// The Language the Runs are drawn in: the one chosen, or the Locale's while none is. A Language
// chosen stays, whatever the Locale.
export const runLanguage = (language: Settings["language"], locale: Locale): Language =>
  language ?? LOCALE_LANGUAGES[locale];

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
      version: 2,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: (state) => settingsOf(state),
      // An entry of version 1: English was its default, never told apart from a choice, so it
      // becomes absent; French was chosen, and stays. Anything else gives the defaults back. The
      // entry is then stored again, in version 2.
      migrate: (stored) => {
        if (!Value.Check(Version1SettingsSchema, stored)) {
          return defaults;
        }

        return settingsOf({
          ...stored,
          language: stored.language === "en" ? null : stored.language,
        });
      },
      // All or nothing: stored settings that do not check out give the defaults back.
      merge: (stored, current) =>
        Value.Check(SettingsSchema, stored) ? { ...current, ...settingsOf(stored) } : current,
    },
  ),
);
