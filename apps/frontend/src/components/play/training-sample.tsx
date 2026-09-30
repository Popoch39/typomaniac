import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { RunConfig } from "typing-engine";

import {
  type BestRun,
  bestRunQueryOptions,
  chosenRunSetting,
  type RunSetting,
} from "@/api/best-run";
import { meQueryOptions } from "@/api/me";
import { GhostExcerpt } from "@/components/play/ghost-excerpt";
import { glimpseKeystrokes } from "@/components/play/ghost-typing";
import { trainingPresetShortLabel } from "@/components/play/training-presets";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useRunStore } from "@/stores/run-store";
import { useSettingsStore } from "@/stores/settings-store";

// The Text of a Best Run: its setting's, drawn from its Seed and Word list version.
const bestRunConfig = (setting: RunSetting, { seed, wordListVersion }: NonNullable<BestRun>) => {
  const textSource = { language: setting.language, wordListVersion, seed };

  return setting.mode === "time"
    ? ({ mode: "time", seconds: setting.length, ...textSource } satisfies RunConfig)
    : ({ mode: "words", words: setting.length, ...textSource } satisfies RunConfig);
};

// The setting as its preset pill writes it: « 30 s », « 50 mots ».
const settingLabel = (setting: RunSetting, locale: Locale) =>
  trainingPresetShortLabel(
    setting.mode === "time"
      ? { mode: "time", seconds: setting.length }
      : { mode: "words", words: setting.length },
    locale,
  );

type GhostSampleProps = { setting: RunSetting; bestRun: NonNullable<BestRun> };

// The Ghost of the Best Run replayed on its Text, and what it is under it: its wpm and its setting.
const GhostSample = ({ setting, bestRun }: GhostSampleProps) => {
  const locale = useLocale();
  const wpm = numberFormat(locale).format(Math.round(bestRun.wpm));

  return (
    <>
      <GhostExcerpt
        config={bestRunConfig(setting, bestRun)}
        keystrokes={bestRun.keystrokes}
        ghost
      />
      <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span aria-hidden="true" className="size-3 shrink-0 rounded-[3px] bg-opponent-caret/60" />
        {m.play_training_ghost({ wpm, setting: settingLabel(setting, locale) }, { locale })}
      </p>
    </>
  );
};

// The next Run's Text, its caret going on alone.
const GlimpseSample = () => {
  const config = useRunStore((state) => state.run.config);

  return <GhostExcerpt config={config} keystrokes={glimpseKeystrokes(config)} ghost={false} />;
};

// The Training card's live zone. A User with a Best Run on the chosen setting, the one its presets
// would play again, sees its Ghost; a Visitor, or without one, a glimpse of the next Run's Text.
export const TrainingSample = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const mode = useSettingsStore((state) => state.mode);
  const seconds = useSettingsStore((state) => state.seconds);
  const words = useSettingsStore((state) => state.words);
  const language = useSettingsStore((state) => state.language);
  const setting = chosenRunSetting({ mode, seconds, words, language }, locale);
  // Never waits: the glimpse shows until the Best Run is read.
  const { data: bestRun } = useQuery({ ...bestRunQueryOptions(setting), enabled: me !== null });

  return (
    <div className="flex h-full w-full flex-col justify-center gap-4">
      {bestRun ? <GhostSample setting={setting} bestRun={bestRun} /> : <GlimpseSample />}
    </div>
  );
};
