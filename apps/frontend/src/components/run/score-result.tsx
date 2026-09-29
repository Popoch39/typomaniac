import type { ScoreState } from "typing-engine";

import { ResultStat } from "@/components/run/result-stat";
import type { RunTone } from "@/components/run/run-tone";

type ScoreResultProps = {
  // Null for a Duel played before the Score: « — » in its place.
  score: Pick<ScoreState, "score" | "bestCombo" | "bursts"> | null;
  // Whose Score it is, for its colour.
  tone?: RunTone;
};

// A final Score, its best Combo and its Bursts: of a Run, or of a player at the end of a Duel.
export const ScoreResult = ({ score, tone }: ScoreResultProps) => (
  <dl className="flex gap-12">
    <ResultStat term="score" size="main" tone={tone}>
      {score === null ? "—" : score.score}
    </ResultStat>
    <ResultStat term="meilleur combo" size="main" tone={tone}>
      {score === null ? "—" : score.bestCombo}
    </ResultStat>
    <ResultStat term="bursts" size="main" tone={tone}>
      {score === null ? "—" : score.bursts}
    </ResultStat>
  </dl>
);
