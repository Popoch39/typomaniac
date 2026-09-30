import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { PlayCard } from "@/components/play/play-card";
import { RankedCardCrest } from "@/components/play/ranked-card-crest";
import { RankedCardRank } from "@/components/play/ranked-card-rank";
import { RankedQueueOverview } from "@/components/play/ranked-queue-overview";
import { RankedSearchAction } from "@/components/play/ranked-search-action";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Ranked card, wider and in the accent: the User's Crest, their rank and its bar, then the way
// into the Queue, with how many wait in it. A Visitor sees the Ranked too, without a rank nor the
// Queue's figures (no socket).
export const RankedCard = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return (
    <PlayCard
      title={m.play_ranked_title({}, { locale })}
      pitch={m.play_ranked_pitch({}, { locale })}
      visual={<RankedCardCrest rank={me?.rank ?? null} />}
      className="flex-[1.4] bg-primary text-on-brand"
    >
      {me === null ? null : (
        <>
          <RankedCardRank rank={me.rank} />
          <RankedQueueOverview />
        </>
      )}
      <RankedSearchAction />
    </PlayCard>
  );
};
