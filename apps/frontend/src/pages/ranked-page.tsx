import { useSuspenseQuery } from "@tanstack/react-query";
import { isPlacement } from "ranked";

import { meQueryOptions } from "@/api/me";
import { RankedAside } from "@/components/ranked/ranked-aside";
import { RankedLadder } from "@/components/ranked/ranked-ladder";

// The Ranked: its Tiers from Maniac down to Fer on the page's whole height, the reader's marked;
// at the right, where they stand, the rules, and the way to the Queue. For a Visitor too: the
// ladder is the same, only playing needs an account.
export const RankedPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const rank = me?.rank ?? null;

  return (
    <div className="flex flex-1 gap-16">
      <RankedLadder standing={rank === null || isPlacement(rank) ? null : rank} />
      <RankedAside rank={rank} />
    </div>
  );
};
