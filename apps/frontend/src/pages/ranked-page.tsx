import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { RankedAside } from "@/components/ranked/ranked-aside";
import { RankedTiers } from "@/components/ranked/ranked-tiers";

// The Ranked: its Tiers from Maniac down to Iron on the page's whole height, the reader's marked;
// at the right, where they stand, the rules, and the way to the Queue. For a Visitor too: the
// Tiers are the same, only playing needs an account.
export const RankedPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const rank = me?.rank ?? null;

  return (
    <div className="flex flex-1 gap-16">
      <RankedTiers rank={rank} />
      <RankedAside rank={rank} />
    </div>
  );
};
