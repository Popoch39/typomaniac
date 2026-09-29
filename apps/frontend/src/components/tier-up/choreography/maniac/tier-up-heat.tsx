import { MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { BEYOND_STAGE } from "@/components/tier-up/stage/beyond-stage";

// The heat rising from under the Diamond → Maniac stage, unseen until it comes, then flickering
// once the gem breaks: on past the stage's edges, as it glows on them.
export const TierUpHeat = () => (
  <div
    data-tier-up="heat"
    className="absolute opacity-0"
    style={{ ...BEYOND_STAGE.box, background: MANIAC_PAINT.heat }}
  >
    <div
      data-tier-up="heat-flicker"
      className="size-full"
      style={{ background: MANIAC_PAINT.heatFlicker }}
    />
  </div>
);
