import type { Rank } from "ranked";

import { PlayRankedLink } from "@/components/ranked/play-ranked-link";
import { RankedPlace } from "@/components/ranked/ranked-place";
import { RankedRules } from "@/components/ranked/ranked-rules";

// The Ranked page's right column: where the reader stands, the rules of the ladder, then the way
// to the Queue at the bottom.
export const RankedAside = ({ rank }: { rank: Rank | null }) => (
  <aside aria-label="Ta Ranked" className="flex w-80 shrink-0 flex-col gap-8 pt-9">
    <RankedPlace rank={rank} />
    <RankedRules />
    <p className="text-sm leading-[1.6] text-muted-foreground">
      Juste après une montée, ta prochaine défaite ne te fait pas redescendre. En Maniac, plus de
      Division : les TP s’accumulent.
    </p>
    <PlayRankedLink />
  </aside>
);
