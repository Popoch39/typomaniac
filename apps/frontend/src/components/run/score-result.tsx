import type { ScoreState } from "typing-engine";

import { ResultStat } from "@/components/run/result-stat";

type ScoreResultProps = { score: Pick<ScoreState, "score" | "bestCombo" | "bursts"> };

// A final Score, its best Combo and its Bursts: of a Run, or of a player at the end of a Duel.
export const ScoreResult = ({ score }: ScoreResultProps) => (
  <dl className="flex gap-12">
    <ResultStat term="score" size="main">
      {score.score}
    </ResultStat>
    <ResultStat term="meilleur combo" size="main">
      {score.bestCombo}
    </ResultStat>
    <ResultStat term="bursts" size="main">
      {score.bursts}
    </ResultStat>
  </dl>
);
