import type { ScoreState } from "typing-engine";

import { ResultStat } from "@/components/run/result-stat";
import type { RunTone } from "@/components/run/run-tone";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ScoreResultProps = {
  // Null for a Duel played before the Score: « — » in its place.
  score: Pick<ScoreState, "score" | "bestCombo" | "bursts"> | null;
  // Whose Score it is, for its colour.
  tone?: RunTone;
};

// A final Score, its best Combo and its Bursts: of a Run, or of a player at the end of a Duel.
export const ScoreResult = ({ score, tone }: ScoreResultProps) => {
  const locale = useLocale();

  // A figure of the Score in the Locale, « — » when there is none.
  const figure = (value: number | undefined) =>
    typeof value === "undefined" ? "—" : numberFormat(locale).format(value);

  return (
    <dl className="flex gap-12">
      <ResultStat term={m.run_stat_score({}, { locale })} size="main" tone={tone}>
        {figure(score?.score)}
      </ResultStat>
      <ResultStat term={m.run_stat_best_combo({}, { locale })} size="main" tone={tone}>
        {figure(score?.bestCombo)}
      </ResultStat>
      <ResultStat term={m.run_stat_bursts({}, { locale })} size="main" tone={tone}>
        {figure(score?.bursts)}
      </ResultStat>
    </dl>
  );
};
