import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useRunStore } from "@/stores/run-store";

// Starts the same Run again: same Seed, so exactly the same Text.
export const ReplayButton = () => {
  const locale = useLocale();
  const replay = useRunStore((state) => state.replay);

  return (
    <Button variant="ghost" onClick={replay} className="text-muted-foreground">
      <RotateCcwIcon data-icon="inline-start" />
      {m.run_replay({}, { locale })}
    </Button>
  );
};
