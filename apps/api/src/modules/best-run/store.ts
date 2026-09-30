import type { Keystroke, Result } from "typing-engine";

import type { RunSetting } from "./model";

// A User's Best Run of a setting as it is kept: what replays it, the Result the server computed
// from its Keystrokes, and when it was sent, in ms since the epoch.
export type BestRunRecord = {
  userId: string;
  setting: RunSetting;
  seed: number;
  wordListVersion: number;
  keystrokes: readonly Keystroke[];
  result: Result;
  at: number;
};

// The Best Runs, one per User and setting, injected through AppConfig: Drizzle in production, in
// memory in the tests.
export type BestRunStore = {
  bestRun: (userId: string, setting: RunSetting) => Promise<BestRunRecord | null>;
  // Keeps `run` as the Best Run of its setting unless the one kept has a wpm as high or higher, in
  // one step: two Runs sent at once never both land. The Best Run kept after it.
  keepIfBetter: (run: BestRunRecord) => Promise<BestRunRecord>;
};

export const sameSetting = (a: RunSetting, b: RunSetting) =>
  a.mode === b.mode && a.length === b.length && a.language === b.language;
