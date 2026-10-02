import {
  applyKeystroke,
  computeResult,
  createRun,
  isFinished,
  type Keystroke,
  latestWordListVersion,
  type RunConfig,
} from "typing-engine";

import type { Clock } from "../../lib/clock";
import { ApiError } from "../../lib/errors";
import {
  type BestRun,
  type BestRunModel,
  offeredSetting,
  type RunSetting,
  type SentRun,
} from "./model";
import type { BestRunRecord, BestRunStore } from "./store";

type BestRunDeps = { store: BestRunStore; clock: Clock };

type SettingQuery = typeof BestRunModel.settingQuery.static;

const invalid = (path: string, message: string) =>
  new ApiError("VALIDATION_FAILED", "This Run is not valid", [{ path, message }]);

const configOf = ({ mode, length, language, seed, wordListVersion }: SentRun): RunConfig =>
  mode === "time"
    ? { mode, seconds: length, language, seed, wordListVersion }
    : { mode, words: length, language, seed, wordListVersion };

// The Run replayed from its first Keystroke, at 0: each one dated no earlier than the one before,
// and none typed once the Run is over. The state it ends on.
const replayed = (config: RunConfig, keystrokes: readonly Keystroke[]) => {
  let state = createRun(config);
  let previous = 0;

  for (const keystroke of keystrokes) {
    if (keystroke.at < previous || isFinished(state, keystroke.at)) {
      throw invalid("/keystrokes", "incoherent");
    }

    state = applyKeystroke(state, keystroke);
    previous = keystroke.at;
  }

  return state;
};

// The Result of a Run, from its Keystrokes only: whatever the client computed is never read. A
// `words` Run ends on its last Keystroke, which must finish it; a `time` Run lasts its time.
const resultOf = (run: SentRun) => {
  if (run.wordListVersion > latestWordListVersion[run.language]) {
    throw invalid("/wordListVersion", "unknown");
  }

  const config = configOf(run);
  const state = replayed(config, run.keystrokes);
  // SAFETY: the model asks for one Keystroke at least.
  const last = run.keystrokes.at(-1) as Keystroke;

  if (run.keystrokes[0]?.at !== 0) {
    throw invalid("/keystrokes", "incoherent");
  }

  if (config.mode === "words" && !isFinished(state, last.at)) {
    throw invalid("/keystrokes", "unfinished");
  }

  return computeResult(config, run.keystrokes, last.at);
};

// Both branches alike on purpose: only the check on `mode` ties the length to its Mode for the type.
const settingOf = ({ mode, length, language }: SentRun): RunSetting =>
  mode === "time" ? { mode, length, language } : { mode, length, language };

const bestRunOf = (record: BestRunRecord): BestRun => ({
  seed: record.seed,
  wordListVersion: record.wordListVersion,
  keystrokes: [...record.keystrokes],
  wpm: record.result.wpm,
});

// Keeps the Run as the Best Run of its setting when its wpm beats the one kept. The Best Run of the
// setting after it, the new one or the one before.
export const sendRun = async ({ store, clock }: BestRunDeps, userId: string, run: SentRun) => {
  const kept = await store.keepIfBetter({
    userId,
    setting: settingOf(run),
    seed: run.seed,
    wordListVersion: run.wordListVersion,
    keystrokes: run.keystrokes,
    result: resultOf(run),
    at: clock.now(),
  });

  return bestRunOf(kept);
};

// The Best Run of the setting, null while it has none; a length the app does not offer is refused.
export const readBestRun = async (store: BestRunStore, userId: string, query: SettingQuery) => {
  if (!offeredSetting.Check(query)) {
    throw new ApiError("VALIDATION_FAILED", "This setting is not offered", [
      { path: "/length", message: "not-offered" },
    ]);
  }

  const record = await store.bestRun(userId, query);

  return record === null ? null : bestRunOf(record);
};
