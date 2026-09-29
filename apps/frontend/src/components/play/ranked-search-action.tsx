import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { QueueLockButton } from "@/components/duel/queue-lock-button";
import { useChooseDuel } from "@/components/duel/use-choose-duel";
import { wallClock } from "@/components/run/clock-context";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";
import { useConnectionStore } from "@/stores/connection-store";

// The Ranked card's button, dark on the accent.
const SEARCH_LOOK = "h-14 bg-on-brand text-lg text-primary hover:bg-on-brand/90";

// The way into the Queue from the Ranked card: Lancer la recherche, which joins it and shows the
// search on Jouer. A Visitor is asked to sign in, a User without a Handle to choose one; a Queue
// lock keeps it disabled with the time left, as the connection tells it; the search launched in
// another tab is said instead.
export const RankedSearchAction = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const chooseDuel = useChooseDuel();
  const setHandleChoiceDeferred = useAuthStore((state) => state.setHandleChoiceDeferred);
  const lockedUntil = useConnectionStore((store) => store.queueLock.until);

  const searchingElsewhere = useConnectionStore(
    (store) => store.place?.at === "queue" && !store.place.here,
  );

  if (me !== null && me.handle === null) {
    return (
      <Button className={SEARCH_LOOK} onClick={() => setHandleChoiceDeferred(false)}>
        {m.handle_duel_choose({}, { locale })}
      </Button>
    );
  }

  if (searchingElsewhere) {
    return (
      <p className="flex h-14 items-center justify-center rounded-full bg-on-brand/15 text-lg font-semibold">
        {m.play_ranked_elsewhere({}, { locale })}
      </p>
    );
  }

  return (
    <QueueLockButton
      lockedUntil={me === null ? null : lockedUntil}
      clock={wallClock}
      onClick={chooseDuel}
      className={SEARCH_LOOK}
    >
      {m.play_ranked_search({}, { locale })}
    </QueueLockButton>
  );
};
