import { queryOptions } from "@tanstack/react-query";
import type { Keystroke, RunConfig } from "typing-engine";

import { api, unwrap } from "@/api/client";
import type { Locale } from "@/locale/locales";
import { durations, runLanguage, type Settings, wordCounts } from "@/stores/settings-store";

// A setting of the solo Run, as the API keys a Best Run: its Mode, its length and its Language.
export type RunSetting = NonNullable<ReturnType<typeof runSettingOf>>;

// The setting a Run is played on, null for a length the app does not offer (a scripted Run).
export const runSettingOf = (config: RunConfig) => {
  const { language } = config;

  if (config.mode === "time") {
    const length = durations.find((seconds) => seconds === config.seconds);

    return length === undefined ? null : { mode: config.mode, length, language };
  }

  const length = wordCounts.find((words) => words === config.words);

  return length === undefined ? null : { mode: config.mode, length, language };
};

// The setting the settings bar has chosen, its Language resolved against the Locale: the one the
// next Run is drawn on.
export const chosenRunSetting = (
  { mode, seconds, words, language }: Settings,
  locale: Locale,
): RunSetting =>
  mode === "time"
    ? { mode, length: seconds, language: runLanguage(language, locale) }
    : { mode, length: words, language: runLanguage(language, locale) };

const fetchBestRun = async (setting: RunSetting) =>
  unwrap(await api.runs.best.get({ query: setting })).bestRun;

// The User's Best Run of the setting (ADR 0016): what replays it, and its wpm; null without one.
export type BestRun = Awaited<ReturnType<typeof fetchBestRun>>;

export const bestRunQueryOptions = (setting: RunSetting) =>
  queryOptions({
    queryKey: ["best-run", setting.mode, setting.length, setting.language],
    queryFn: () => fetchBestRun(setting),
  });

// Sends a finished Run: the server replays it and answers with the Best Run of its setting.
export const sendRun = async (
  setting: RunSetting,
  config: RunConfig,
  keystrokes: readonly Keystroke[],
) =>
  unwrap(
    await api.runs.post({
      ...setting,
      seed: config.seed,
      wordListVersion: config.wordListVersion,
      keystrokes: [...keystrokes],
    }),
  );
