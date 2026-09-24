import { ResultStat } from "@/components/run/result-stat";
import { useRunStore } from "@/stores/run-store";

// The final Score of the finished Run and its best Combo.
export const ScoreResult = () => {
  const score = useRunStore((state) => state.score.score);
  const bestCombo = useRunStore((state) => state.score.bestCombo);
  const bursts = useRunStore((state) => state.score.bursts);

  return (
    <dl className="flex gap-12">
      <ResultStat term="score" size="main">
        {score}
      </ResultStat>
      <ResultStat term="meilleur combo" size="main">
        {bestCombo}
      </ResultStat>
      <ResultStat term="bursts" size="main">
        {bursts}
      </ResultStat>
    </dl>
  );
};
