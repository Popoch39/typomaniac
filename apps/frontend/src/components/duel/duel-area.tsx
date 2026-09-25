import { useEffect } from "react";

import { DuelEnded } from "@/components/duel/duel-ended";
import { DuelHandleRequired } from "@/components/duel/duel-handle-required";
import { DuelInterrupted } from "@/components/duel/duel-interrupted";
import { DuelQueue } from "@/components/duel/duel-queue";
import { DuelTypingArea } from "@/components/duel/duel-typing-area";
import { useClock } from "@/components/run/clock-context";
import { useDuelStore } from "@/stores/duel-store";

// In Duel, in place of the typing area: takes the User's place while shown, so leaving Duel
// (Annuler, Solo) takes the User out of the Queue. The connection stays open (RealtimeConnection).
export const DuelArea = () => {
  const clock = useClock();
  const state = useDuelStore((store) => store.state);
  const enter = useDuelStore((store) => store.enter);
  const exit = useDuelStore((store) => store.exit);

  useEffect(() => {
    enter(clock);

    return exit;
  }, [clock, enter, exit]);

  switch (state.phase) {
    case "connecting":
    case "queued":
      return <DuelQueue />;
    case "handle-required":
      return <DuelHandleRequired />;
    case "countdown":
    case "running":
    case "finishing":
      return (
        <DuelTypingArea
          opponent={state.duel.opponent}
          opponentRank={state.duel.opponentRank}
          startsAt={state.duel.startsAt}
          seconds={state.duel.config.seconds}
        />
      );
    case "ended":
      return <DuelEnded ending={state.ending} />;
    case "elsewhere":
      return (
        <DuelInterrupted message="Le Duel est ouvert dans un autre onglet." action="Jouer ici" />
      );
    case "disconnected":
      return (
        <DuelInterrupted
          message="La connexion au serveur a été perdue."
          action="Chercher un Duel"
        />
      );
  }
};
