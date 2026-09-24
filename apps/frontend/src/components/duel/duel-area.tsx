import { useEffect } from "react";

import { DuelFound } from "@/components/duel/duel-found";
import { DuelInterrupted } from "@/components/duel/duel-interrupted";
import { DuelQueue } from "@/components/duel/duel-queue";
import { useDuelStore } from "@/stores/duel-store";

// In Duel, in place of the typing area: connected while shown, so leaving Duel (Annuler, Solo)
// closes the socket and takes the User out of the Queue.
export const DuelArea = () => {
  const state = useDuelStore((store) => store.state);
  const connect = useDuelStore((store) => store.connect);
  const disconnect = useDuelStore((store) => store.disconnect);

  useEffect(() => {
    connect();

    return disconnect;
  }, [connect, disconnect]);

  switch (state.phase) {
    case "connecting":
    case "queued":
      return <DuelQueue />;
    case "found":
      return <DuelFound opponent={state.opponent} />;
    case "replaced":
      return <DuelInterrupted message="Le Duel est ouvert dans un autre onglet." />;
    case "disconnected":
      return <DuelInterrupted message="La connexion au serveur a été perdue." />;
  }
};
