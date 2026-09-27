import type { Tier } from "ranked";

import { TierUpCenter } from "@/components/tier-up/tier-up-center";
import { tierUpPaint } from "@/components/tier-up/tier-up-paint";

// The light around the Emblem: the halo, unseen until it opens at the impact and then breathes,
// and the ring that flies out of it, small and lit behind the old Emblem until then, as in the
// canvas.
export const TierUpHalo = ({ tier }: { tier: Tier }) => {
  const paint = tierUpPaint(tier);

  return (
    <TierUpCenter>
      <div
        data-tier-up="halo"
        className="absolute -top-[230px] -left-[230px] size-[460px] opacity-0"
      >
        <div
          data-tier-up="breath"
          className="size-full rounded-full"
          style={{ background: paint.halo }}
        />
      </div>
      <div
        data-tier-up="ring"
        className="absolute -top-[320px] -left-[320px] size-[640px] rounded-full border-2"
        style={{ borderColor: paint.light, transform: "scale(0.15)" }}
      />
    </TierUpCenter>
  );
};
