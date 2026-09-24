import type { ScoreState } from "typing-engine";

import { LiveStat } from "@/components/run/live-stat";
import { cn } from "cn";

type ScoreStatsProps = { score: ScoreState; tone?: "own" | "opponent" };

// A Score so far, with the multiplier and the length of its Combo. A broken Combo shows in red
// from the mistake until the next right word; the Bursts counter pulses on each new one.
export const ScoreStats = ({ score, tone = "own" }: ScoreStatsProps) => {
  const broken = score.combo === 0 && score.bestCombo > 0;

  return (
    <dl className="flex gap-6">
      <LiveStat term="score" tone={tone}>
        {score.score}
      </LiveStat>
      <LiveStat term="multiplicateur" tone={tone}>
        x{score.multiplier}
      </LiveStat>
      <LiveStat term="combo" tone={broken ? "broken" : tone}>
        {score.combo}
      </LiveStat>
      <LiveStat term="bursts" tone={tone}>
        {/* A new key remounts the value: its entrance animation plays again, from the first. */}
        <span
          key={score.bursts}
          className={cn(
            "inline-block",
            score.bursts > 0 &&
              "motion-safe:animate-in motion-safe:duration-500 motion-safe:zoom-in-150",
          )}
        >
          {score.bursts}
        </span>
      </LiveStat>
    </dl>
  );
};
