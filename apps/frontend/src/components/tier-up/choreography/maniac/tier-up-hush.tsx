import { MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { BEYOND_STAGE } from "@/components/tier-up/stage/beyond-stage";

// The silence of the Diamant → Maniac artboard: the stage holding its breath, gone nearly black
// all around the vortex, as dark past its edges as on them. Unseen until then.
export const TierUpHush = () => (
  <div
    data-tier-up="hush"
    className="absolute opacity-0"
    style={{ ...BEYOND_STAGE.box, background: MANIAC_PAINT.hush }}
  />
);
