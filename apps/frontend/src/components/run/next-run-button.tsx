import { ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useRunStore } from "@/stores/run-store";

// Starts the next Run, on a new Seed. Reached by Tab from the typing input or from the Result,
// so Tab then Enter presses it.
export const NextRunButton = () => {
  const locale = useLocale();
  const next = useRunStore((state) => state.next);

  return (
    <Button variant="ghost" onClick={next} className="text-muted-foreground">
      <ChevronRightIcon data-icon="inline-start" />
      {m.run_next({}, { locale })}
    </Button>
  );
};
