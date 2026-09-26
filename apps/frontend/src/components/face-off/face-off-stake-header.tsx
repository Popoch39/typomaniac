import type { Standing } from "ranked";

import { standingName } from "@/components/tier/tier";
import { TierEmblem } from "@/components/tier/tier-emblem";

type FaceOffStakeHeaderProps = { promotion: Standing | null };

// The head of the Stake: the rank a win would move up to, in its colour (the card's), with its
// emblem; « En jeu » when a win keeps the Division.
export const FaceOffStakeHeader = ({ promotion }: FaceOffStakeHeaderProps) => (
  <p className="flex items-center justify-between">
    <span className="text-[0.8125rem] font-bold tracking-[0.1em] text-muted-foreground uppercase">
      {promotion === null ? "En jeu" : "Gagne et passe"}
    </span>{" "}
    {promotion === null ? null : (
      <span className="flex items-center gap-2 text-xl font-extrabold">
        {/* The name says the Tier already: the emblem is only seen. */}
        <span aria-hidden className="size-6.5">
          <TierEmblem tier={promotion.tier} />
        </span>
        {standingName(promotion)}
      </span>
    )}
  </p>
);
