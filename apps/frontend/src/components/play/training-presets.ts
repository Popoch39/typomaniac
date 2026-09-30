import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";
import type { Settings } from "@/stores/settings-store";

// A Training preset: the Mode and its duration or word count, as the settings bar would set them.
export type TrainingPreset =
  | { mode: "time"; seconds: Settings["seconds"] }
  | { mode: "words"; words: Settings["words"] };

// The Training card's presets, in the board's order.
export const TRAINING_PRESETS: readonly TrainingPreset[] = [
  { mode: "time", seconds: 30 },
  { mode: "words", words: 50 },
  { mode: "time", seconds: 60 },
];

// A preset's count: its seconds in `time`, its words in `words`.
const countOf = (preset: TrainingPreset) =>
  preset.mode === "time" ? preset.seconds : preset.words;

// What tells a preset apart from the others: « time-30 ».
export const trainingPresetId = (preset: TrainingPreset) => `${preset.mode}-${countOf(preset)}`;

// A preset's name, in the Locale: « time 30 », « words 50 ».
export const trainingPresetLabel = (preset: TrainingPreset, locale: Locale) => {
  const count = numberFormat(locale).format(countOf(preset));

  return preset.mode === "time"
    ? m.play_preset_time({ seconds: count }, { locale })
    : m.play_preset_words({ words: count }, { locale });
};

// What its pill writes, short enough for the three to hold on one line of a narrow card: « 30 s »,
// « 50 mots ».
export const trainingPresetShortLabel = (preset: TrainingPreset, locale: Locale) => {
  const count = numberFormat(locale).format(countOf(preset));

  return preset.mode === "time"
    ? m.play_preset_time_short({ seconds: count }, { locale })
    : m.play_preset_words_short({ words: count }, { locale });
};
