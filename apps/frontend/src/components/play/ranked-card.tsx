import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { PlayCard } from "@/components/play/play-card";
import { RankedCardRank } from "@/components/play/ranked-card-rank";
import { RankedLive } from "@/components/play/ranked-live";
import { RankedSearchAction } from "@/components/play/ranked-search-action";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Ranked card, wider and in the accent: what goes on right now (the Queue, the last Duels of
// the User's Tier), their rank and its bar, then the way into the Queue. A Visitor sees the Ranked
// too, its pitch and the way to sign in, without a live zone nor a rank (no socket). The search
// comes out of it: it slides to the middle of the page and takes the size of the search's card.
export const RankedCard = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return (
    <PlayCard
      search
      title={m.play_ranked_title({}, { locale })}
      pitch={m.play_ranked_pitch({}, { locale })}
      live={me === null ? null : <RankedLive />}
      className="flex-[1.4] bg-primary text-on-brand"
    >
      {me === null ? null : <RankedCardRank rank={me.rank} />}
      <RankedSearchAction />
    </PlayCard>
  );
};
