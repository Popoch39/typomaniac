import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRunStore } from "@/stores/run-store";

// Starts the same Run again: same Seed, so exactly the same Text.
export const ReplayButton = () => {
  const replay = useRunStore((state) => state.replay);

  return (
    <Button variant="ghost" onClick={replay}>
      <RotateCcwIcon data-icon="inline-start" />
      Rejouer
    </Button>
  );
};
