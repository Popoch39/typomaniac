import type { CharCounts, Result } from "typing-engine";

import { ResultStat } from "@/components/run/result-stat";
import type { RunTone } from "@/components/run/run-tone";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A figure of the Result, rounded and written in the Locale.
const rounded = (value: number, locale: Locale) => numberFormat(locale).format(Math.round(value));

// A rounded share, « 97 % » in French, « 97% » in English.
const percent = (value: number, locale: Locale) =>
  m.format_percent({ value: rounded(value, locale) }, { locale });

// e.g. `49/2/1/0`, in the order of the description below.
const formatChars = (chars: CharCounts, locale: Locale) =>
  [chars.correct, chars.incorrect, chars.extra, chars.missed]
    .map((count) => rounded(count, locale))
    .join("/");

// Whose Result it is, for its colour.
type RunResultProps = { result: Result; tone?: RunTone };

// The Result of a finished Run, rounded for display: wpm and accuracy first, then the details.
export const RunResult = ({ result, tone }: RunResultProps) => {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6">
      <dl className="flex gap-12">
        <ResultStat term={m.run_stat_wpm({}, { locale })} size="main" tone={tone}>
          {rounded(result.wpm, locale)}
        </ResultStat>
        <ResultStat term={m.run_stat_accuracy({}, { locale })} size="main" tone={tone}>
          {percent(result.accuracy, locale)}
        </ResultStat>
      </dl>
      <dl className="flex flex-wrap gap-x-12 gap-y-4">
        <ResultStat term={m.run_stat_raw({}, { locale })} size="secondary" tone={tone}>
          {rounded(result.raw, locale)}
        </ResultStat>
        <ResultStat term={m.run_stat_consistency({}, { locale })} size="secondary" tone={tone}>
          {percent(result.consistency, locale)}
        </ResultStat>
        <ResultStat
          term={m.run_stat_chars({}, { locale })}
          size="secondary"
          tone={tone}
          description={m.run_stat_chars_detail({}, { locale })}
        >
          {formatChars(result.chars, locale)}
        </ResultStat>
      </dl>
    </div>
  );
};
