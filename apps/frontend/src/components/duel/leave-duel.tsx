import { Button } from "@/components/ui/button";
import { duelOf, useDuelStore } from "@/stores/duel-store";

// Leaving the Duel on purpose: a Forfeit, the end screen follows. Only once connected: the server
// has to hear it.
export const LeaveDuel = () => {
  const leave = useDuelStore((store) => store.leave);
  const connected = useDuelStore((store) => duelOf(store.state)?.connected ?? false);

  return (
    <Button variant="ghost" size="sm" disabled={!connected} onClick={leave}>
      Quitter le Duel
    </Button>
  );
};
