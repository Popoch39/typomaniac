import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayStore } from "@/stores/play-store";

// Waiting in the Queue for an opponent. Annuler goes back to Solo, which leaves the Queue.
export const DuelQueue = () => {
  const setPlay = usePlayStore((state) => state.setPlay);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <output className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden="true" />
        En attente d'un adversaire…
      </output>
      <Button variant="outline" onClick={() => setPlay("solo")}>
        Annuler
      </Button>
    </div>
  );
};
