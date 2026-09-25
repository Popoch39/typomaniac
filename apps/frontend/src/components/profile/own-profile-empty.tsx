import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// No finished Duel yet on one's own Profile: the Stats come with the first one.
export const OwnProfileEmpty = () => (
  <EmptyState
    title="Pas encore de Duel"
    reason="Tes Stats apparaîtront après ton premier Duel terminé."
    action={
      <Button nativeButton={false} render={<Link to="/" />}>
        Lancer un Duel
      </Button>
    }
  />
);
