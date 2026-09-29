import { MANIAC_SWIRL } from "@/components/tier-up/choreography/maniac/maniac-lights";
import { FIRE, MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The vortex the old gem is sucked into, as the Diamond → Maniac artboard draws it: embers
// swirling in from all around, each on its own line through the crown's centre, turning with it as
// it closes in; and the heart they feed, growing until the crown drops. All unseen until then.
export const TierUpVortex = () => (
  <TierUpCenter>
    {MANIAC_SWIRL.map(({ angle }, index) => (
      <div
        key={angle}
        data-tier-up="swirl-turn"
        data-index={index}
        className="absolute top-0 left-0"
      >
        <i
          data-tier-up="swirl"
          className="absolute -top-1 -left-1 size-2 rounded-full opacity-0"
          style={{ background: FIRE.spark, boxShadow: MANIAC_PAINT.glow(12, 3) }}
        />
      </div>
    ))}
    <i
      data-tier-up="core"
      className="absolute -top-[30px] -left-[30px] size-[60px] rounded-full opacity-0"
      style={{ background: MANIAC_PAINT.core, boxShadow: MANIAC_PAINT.coreGlow }}
    />
  </TierUpCenter>
);
