import { MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { TierUpCenter } from "@/components/tier-up/stage/tier-up-center";

// The rays fade out this far from the crown: the fine ones sooner than the pale ones.
const FINE_MASK = "radial-gradient(circle, black 5%, transparent 55%)";

const BROAD_MASK = "radial-gradient(circle, black 5%, transparent 60%)";

// The two wheels of rays of fire around the crown, as the Diamant → Maniac artboard draws them:
// fine rays close together, then pale ones far apart, turning against each other from the start
// as in the artboard, unseen until each fades in as the crown catches fire.
export const TierUpManiacRays = () => (
  <TierUpCenter>
    <div
      data-tier-up="rays"
      className="absolute -top-[900px] -left-[900px] size-[1800px] opacity-0"
    >
      <div
        className="size-full rounded-full"
        style={{ background: MANIAC_PAINT.fineRays, maskImage: FINE_MASK }}
      />
    </div>
    <div
      data-tier-up="rays-back"
      className="absolute -top-[620px] -left-[620px] size-[1240px] opacity-0"
    >
      <div
        className="size-full rounded-full"
        style={{ background: MANIAC_PAINT.broadRays, maskImage: BROAD_MASK }}
      />
    </div>
  </TierUpCenter>
);
