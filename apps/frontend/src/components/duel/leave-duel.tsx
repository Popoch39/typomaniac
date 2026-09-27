import { Button } from "@/components/ui/button";
import { duelOf, useDuelStore } from "@/stores/duel-store";

// Leaving the Duel on purpose: a Forfeit, the end screen follows. Only once connected: the server
// has to hear it. The only way out of the Duel's scene, drawn as its board draws it.
export const LeaveDuel = () => {
  const leave = useDuelStore((store) => store.leave);
  const connected = useDuelStore((store) => duelOf(store.state)?.connected ?? false);

  return (
    <Button
      variant="ghost"
      disabled={!connected}
      onClick={leave}
      className="rounded-[14px] border-0 px-4.5 text-muted-foreground"
    >
      Quitter le Duel
    </Button>
  );
};
