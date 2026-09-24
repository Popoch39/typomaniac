import { useEffect } from "react";

import { DuelEnded } from "@/components/duel/duel-ended";
import { DuelInterrupted } from "@/components/duel/duel-interrupted";
import { DuelQueue } from "@/components/duel/duel-queue";
import { DuelTypingArea } from "@/components/duel/duel-typing-area";
import { useClock } from "@/components/run/clock-context";
import { useDuelStore } from "@/stores/duel-store";

// In Duel, in place of the typing area: connected while shown, so leaving Duel (Annuler, Solo)
// closes the socket and takes the User out of the Queue.
export const DuelArea = () => {
  const clock = useClock();
  const state = useDuelStore((store) => store.state);
  const connect = useDuelStore((store) => store.connect);
  const disconnect = useDuelStore((store) => store.disconnect);

  useEffect(() => {
    connect(clock);

    return disconnect;
  }, [clock, connect, disconnect]);

  switch (state.phase) {
    case "connecting":
    case "queued":
      return <DuelQueue />;
    case "countdown":
    case "running":
    case "finishing":
      return (
        <DuelTypingArea
          opponent={state.duel.opponent}
          startsAt={state.duel.startsAt}
          seconds={state.duel.config.seconds}
        />
      );
    case "ended":
      return <DuelEnded ending={state.ending} />;
    case "replaced":
      return <DuelInterrupted message="Le Duel est ouvert dans un autre onglet." />;
    case "disconnected":
      return <DuelInterrupted message="La connexion au serveur a été perdue." />;
  }
};
