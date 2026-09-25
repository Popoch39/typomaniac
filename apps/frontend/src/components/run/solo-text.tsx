import { RunText } from "@/components/run/run-text";
import { useRunStore } from "@/stores/run-store";

// The Text of the Solo Run, alone on it, the word of its last Burst highlighted.
export const SoloText = () => {
  const run = useRunStore((state) => state.run);
  const lastBurst = useRunStore((state) => state.score.lastBurst);

  return <RunText run={run} tone="own" other={null} lastBurst={lastBurst} />;
};
