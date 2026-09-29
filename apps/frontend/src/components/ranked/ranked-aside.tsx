import type { Rank } from "ranked";

import { PlayRankedLink } from "@/components/ranked/play-ranked-link";
import { RankedPlace } from "@/components/ranked/ranked-place";
import { RankedRules } from "@/components/ranked/ranked-rules";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Ranked page's right column: where the reader stands, the rules of the Ranked, then the way
// to the Queue at the bottom.
export const RankedAside = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  return (
    <aside
      aria-label={m.ranked_aside_label({}, { locale })}
      className="flex w-80 shrink-0 flex-col gap-8 pt-9"
    >
      <RankedPlace rank={rank} />
      <RankedRules />
      <p className="text-sm leading-[1.6] text-muted-foreground">
        {m.ranked_aside_note({}, { locale })}
      </p>
      <PlayRankedLink />
    </aside>
  );
};
