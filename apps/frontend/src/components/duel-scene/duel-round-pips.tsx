import { cn } from "cn";

import type { RoundPip } from "@/components/duel-scene/duel-round-view";

type DuelRoundPipsProps = {
  // A pip per Round, filled for those this player won.
  pips: readonly RoundPip[];
  // Filled in this player's colour: the accent for this User, the blue for the opponent.
  tone: "bg-brand" | "bg-opponent";
};

// One player's Rounds of the Bo3, in pips: drawn only, the tracker reads the count out.
export const DuelRoundPips = ({ pips, tone }: DuelRoundPipsProps) => (
  <span className="flex gap-1" aria-hidden>
    {pips.map(({ round, won }) => (
      <span
        key={round}
        data-pip
        data-won={won ? "" : undefined}
        className={cn("size-2.5 rounded-full", won ? tone : "bg-surface-2")}
      />
    ))}
  </span>
);
