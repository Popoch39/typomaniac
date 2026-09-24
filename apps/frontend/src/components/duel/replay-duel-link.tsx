import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

// Opens the Replay of the Duel just played.
export const ReplayDuelLink = ({ duelId }: { duelId: string }) => (
  <Button
    variant="ghost"
    nativeButton={false}
    render={<Link to="/duels/$duelId" params={{ duelId }} />}
  >
    Revoir
  </Button>
);
