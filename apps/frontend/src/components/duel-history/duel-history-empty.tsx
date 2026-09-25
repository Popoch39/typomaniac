import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// No finished Duel yet: the Duel history fills up with each one.
export const DuelHistoryEmpty = () => (
  <EmptyState
    title="Aucun Duel pour l'instant"
    reason="Ta Duel history se remplit à chaque Duel que tu termines."
    action={
      <Button nativeButton={false} render={<Link to="/" />}>
        Lancer un Duel
      </Button>
    }
  />
);
