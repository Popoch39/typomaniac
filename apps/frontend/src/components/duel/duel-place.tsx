import { useEffect, useEffectEvent } from "react";

import { useDuelSeat } from "@/components/duel/use-duel-seat";
import { useClock } from "@/components/run/clock-context";
import { useDuelStore } from "@/stores/duel-store";

// Takes the User's place while this tab holds a seat of the Duel, above the pages: the Queue from
// Lancer la recherche to Annuler, whatever page they go to meanwhile, then the Duel's URL once it
// is found, and back to the Queue from its end, never letting it go. Leaving them both takes the
// User out of the Queue, or forfeits the Duel in play. The connection stays open
// (RealtimeConnection).
export const DuelPlace = () => {
  const clock = useClock();
  const seat = useDuelSeat();
  const enter = useDuelStore((store) => store.enter);
  const moveTo = useDuelStore((store) => store.moveTo);
  const exit = useDuelStore((store) => store.exit);

  const held = seat !== null;

  const enterSeat = useEffectEvent(() => {
    if (seat !== null) {
      enter(clock, seat);
    }
  });

  useEffect(() => {
    if (!held) {
      return;
    }

    enterSeat();

    return exit;
  }, [held, exit]);

  useEffect(() => {
    if (seat !== null) {
      moveTo(seat);
    }
  }, [seat, moveTo]);

  return null;
};
