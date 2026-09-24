import { RunText } from "@/components/run/run-text";
import { useRunStore } from "@/stores/run-store";

// The Text of the Solo Run, alone on it.
export const SoloText = () => {
  const run = useRunStore((state) => state.run);

  return <RunText run={run} opponent={null} />;
};
