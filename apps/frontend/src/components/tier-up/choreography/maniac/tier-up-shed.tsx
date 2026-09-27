import { MANIAC_SHED } from "@/components/tier-up/choreography/maniac/maniac-lights";
import { FIRE, MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The sparks the Maniac's wings shed as they spread, each white-hot, from its place by a wing,
// unseen until it flies off.
export const TierUpShed = () => (
  <TierUpCenter>
    {MANIAC_SHED.map(({ left, top, size }) => (
      <i
        key={`${left} ${top}`}
        data-tier-up="shed"
        className="absolute rounded-full opacity-0"
        style={{
          left: left - size / 2,
          top: top - size / 2,
          width: size,
          height: size,
          background: FIRE.pale,
          boxShadow: MANIAC_PAINT.glow(12, 2),
        }}
      />
    ))}
  </TierUpCenter>
);
