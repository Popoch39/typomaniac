import { ScoreStats } from "@/components/run/score-stats";
import { useRunStore } from "@/stores/run-store";

// The Score of the Run in progress, with the multiplier and the length of its Combo.
export const LiveScore = () => {
  const score = useRunStore((state) => state.score);

  return <ScoreStats score={score} />;
};
