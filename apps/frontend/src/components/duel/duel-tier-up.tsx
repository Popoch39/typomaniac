import { useState } from "react";

import { type DuelRanked, rankChange, tierReached } from "@/components/duel/rank-change";
import { TierUp } from "@/components/tier-up/tier-up";

type DuelTierUpProps = { ranked: DuelRanked; onClosed: () => void };

// The Tier-up of a ranked Duel that moved the User up into a new Tier or Maniac, over its end
// screen: once, never again for this end once closed.
export const DuelTierUp = ({ ranked, onClosed }: DuelTierUpProps) => {
  const [closed, setClosed] = useState(false);
  const reached = tierReached(rankChange(ranked));

  if (closed || reached === null) {
    return null;
  }

  const close = () => {
    setClosed(true);
    onClosed();
  };

  return <TierUp from={reached.from} to={reached.to} onClose={close} />;
};
