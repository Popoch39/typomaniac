import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

import { DuelModel } from "../duel/model";

// The lengths the app offers: seconds for a `time` Run, words for a `words` Run. Any other is
// refused, so no Best Run is ever kept for a setting nobody can play.
export const RUN_SECONDS = [15, 30, 60, 120] as const;

export const RUN_WORDS = [10, 25, 50, 100] as const;

// Far past what anyone types in the longest Run, 120 s: the body stays small.
const MAX_RUN_KEYSTROKES = 10_000;

const language = t.UnionEnum(["fr", "en"]);

// A setting of the solo Run: its Mode, its length and its Language. Each setting keeps its own
// Best Run.
const timeSetting = t.Object({
  mode: t.Literal("time"),
  length: t.UnionEnum(RUN_SECONDS),
  language,
});

const wordsSetting = t.Object({
  mode: t.Literal("words"),
  length: t.UnionEnum(RUN_WORDS),
  language,
});

const setting = t.Union([timeSetting, wordsSetting]);

export type RunSetting = typeof setting.static;

// What replays a Run on its Text: its Seed, its Word list version and its Keystrokes, `at` in ms
// since its first Keystroke.
const replayable = t.Object({
  // A 32-bit unsigned Seed, as the client draws it.
  seed: t.Integer({ minimum: 0, maximum: 2 ** 32 - 1 }),
  wordListVersion: t.Integer({ minimum: 1 }),
  keystrokes: t.Array(DuelModel.keystroke, { minItems: 1, maxItems: MAX_RUN_KEYSTROKES }),
});

// A finished Run as the client sends it: never its Result, which the server computes.
const run = t.Union([
  t.Composite([timeSetting, replayable]),
  t.Composite([wordsSetting, replayable]),
]);

export type SentRun = typeof run.static;

// The Best Run of a setting: what replays it, and its wpm as the server computed it.
const bestRun = t.Composite([replayable, t.Object({ wpm: t.Number() })]);

export type BestRun = typeof bestRun.static;

// A setting, the length one the app offers for its Mode: the query's is only a number.
export const offeredSetting = TypeCompiler.Compile(setting);

export const BestRunModel = {
  run,
  // The setting to read, its length checked against its Mode by `offeredSetting`: Elysia does not
  // turn the text of a query into the numbers of a union.
  settingQuery: t.Object({ mode: t.UnionEnum(["time", "words"]), length: t.Numeric(), language }),
  // The Best Run of the setting after a Run was sent.
  bestRun,
  // Null while the setting has none.
  bestRunOfSetting: t.Object({ bestRun: t.Nullable(bestRun) }),
};
