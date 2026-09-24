import { ResultStat } from "@/components/run/result-stat";
import { useRunStore } from "@/stores/run-store";

// The final Score of the finished Run and its best Combo.
export const ScoreResult = () => {
  const score = useRunStore((state) => state.score.score);
  const bestCombo = useRunStore((state) => state.score.bestCombo);

  return (
    <dl className="flex gap-12">
      <ResultStat term="score" size="main">
        {score}
      </ResultStat>
      <ResultStat term="meilleur combo" size="main">
        {bestCombo}
      </ResultStat>
    </dl>
  );
};
