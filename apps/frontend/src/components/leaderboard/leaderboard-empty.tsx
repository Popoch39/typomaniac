import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Nobody past Placement yet: the Classement fills with the Duels of the Queue.
export const LeaderboardEmpty = () => (
  <EmptyState
    title="Personne n'est encore classé"
    reason="Un User entre au Classement après ses 5 Duels de Placement. Lance un Duel pour y figurer."
    action={
      <Button nativeButton={false} render={<Link to="/" />}>
        Jouer
      </Button>
    }
  />
);
