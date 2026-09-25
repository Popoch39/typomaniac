import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { useAuthStore } from "@/stores/auth-store";
import { useDuelStore } from "@/stores/duel-store";

// The server refused the Queue: a Duel shows each player's Handle, and this User has none. Choosing
// one opens the Handle dialog again; once chosen, the User joins the Queue from here.
export const DuelHandleRequired = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const setHandleChoiceDeferred = useAuthStore((state) => state.setHandleChoiceDeferred);
  const joinQueue = useDuelStore((store) => store.joinQueue);

  const handle = me?.handle ?? null;

  return (
    <div className="flex flex-col items-center gap-6 rounded-card bg-card px-8 py-12 text-center">
      <output className="text-muted-foreground">
        {handle === null
          ? "En Duel, ton adversaire te voit par ton Handle : choisis-en un pour jouer. Les Runs solo restent ouverts sans."
          : `Ton adversaire te verra en ${atHandle(handle)}.`}
      </output>
      {handle === null ? (
        <Button onClick={() => setHandleChoiceDeferred(false)}>Choisir mon Handle</Button>
      ) : (
        <Button onClick={joinQueue}>Chercher un Duel</Button>
      )}
    </div>
  );
};
