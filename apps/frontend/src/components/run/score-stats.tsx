import type { ScoreState } from "typing-engine";

import { LiveStat } from "@/components/run/live-stat";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

type ScoreStatsProps = { score: ScoreState; tone?: "own" | "opponent" };

// A Score so far, with the multiplier and the length of its Combo. A broken Combo shows in red
// from the mistake until the next right word; the Bursts counter pulses on each new one.
export const ScoreStats = ({ score, tone = "own" }: ScoreStatsProps) => {
  const locale = useLocale();
  const numbers = numberFormat(locale);
  const broken = score.combo === 0 && score.bestCombo > 0;

  return (
    <dl className="flex gap-7">
      <LiveStat term={m.run_stat_score({}, { locale })} tone={tone}>
        {numbers.format(score.score)}
      </LiveStat>
      <LiveStat term={m.run_stat_multiplier({}, { locale })} tone={tone}>
        {m.run_stat_multiplier_value({ value: numbers.format(score.multiplier) }, { locale })}
      </LiveStat>
      <LiveStat term={m.run_stat_combo({}, { locale })} tone={broken ? "broken" : tone}>
        {numbers.format(score.combo)}
      </LiveStat>
      <LiveStat term={m.run_stat_bursts({}, { locale })} tone={tone}>
        {/* A new key remounts the value: its entrance animation plays again, from the first. */}
        <span
          key={score.bursts}
          className={cn(
            "inline-block",
            score.bursts > 0 &&
              "motion-safe:animate-in motion-safe:duration-500 motion-safe:zoom-in-150",
          )}
        >
          {numbers.format(score.bursts)}
        </span>
      </LiveStat>
    </dl>
  );
};
