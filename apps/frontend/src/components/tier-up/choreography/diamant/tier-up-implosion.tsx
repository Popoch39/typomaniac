import type { Tier } from "ranked";

import { DIAMANT_STREAKS } from "@/components/tier-up/choreography/diamant/diamant-lights";
import { TierUpAlongLine } from "@/components/tier-up/parts/tier-up-along-line";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// What the Platine implodes into, as the Platine → Diamant artboard draws it: the streaks of
// light rushing in from all around, each along its own line through the Blason's centre, and the
// heart of light they feed, growing until the gem slams down. All unseen until then.
export const TierUpImplosion = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      {DIAMANT_STREAKS.map(({ angle, length }, index) => (
        <TierUpAlongLine key={angle} angle={angle}>
          <i
            data-tier-up="streak"
            data-index={index}
            className="absolute -top-px left-0 h-0.5 origin-left opacity-0"
            style={{ width: length, background: paint.streak }}
          />
        </TierUpAlongLine>
      ))}
      <i
        data-tier-up="core"
        className="absolute -top-5 -left-5 size-10 rounded-full opacity-0"
        style={{ background: paint.core, boxShadow: paint.coreGlow }}
      />
    </TierUpCenter>
  );
};
