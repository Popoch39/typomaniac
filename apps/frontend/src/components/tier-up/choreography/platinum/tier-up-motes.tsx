import type { Tier } from "ranked";

import type { TierUpMote } from "@/components/tier-up/parts/mote-rise";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

type TierUpMotesProps = { tier: Tier; motes: readonly TierUpMote[] };

// The motes of light rising over the stage, each a glowing dot of the Tier's light, unseen until
// it first rises.
export const TierUpMotes = ({ tier, motes }: TierUpMotesProps) => {
  const paint = tierUpPaint(tier);

  return (
    <div className="absolute inset-0">
      {motes.map(({ left, top, size }) => (
        <i
          key={`${left} ${top}`}
          data-tier-up="mote"
          className="absolute rounded-full opacity-0"
          style={{
            left,
            top,
            width: size,
            height: size,
            background: paint.light,
            boxShadow: paint.glow(10),
          }}
        />
      ))}
    </div>
  );
};
