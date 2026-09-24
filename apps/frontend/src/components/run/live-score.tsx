import { LiveStat } from "@/components/run/live-stat";
import { useRunStore } from "@/stores/run-store";

// The Score of the Run in progress, with the multiplier and the length of its Combo.
export const LiveScore = () => {
  const score = useRunStore((state) => state.score.score);
  const multiplier = useRunStore((state) => state.score.multiplier);
  const combo = useRunStore((state) => state.score.combo);

  return (
    <dl className="flex gap-6">
      <LiveStat term="score">{score}</LiveStat>
      <LiveStat term="multiplicateur">x{multiplier}</LiveStat>
      <LiveStat term="combo">{combo}</LiveStat>
    </dl>
  );
};
