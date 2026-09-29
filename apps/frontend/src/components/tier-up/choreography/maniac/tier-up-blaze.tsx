import { MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { windowOnStage } from "@/components/tier-up/stage/beyond-stage";
import { useStageScale } from "@/components/tier-up/stage/use-stage-scale";

// The fire spreading along the window's edges as the Maniac's crown catches, then flickering
// there, as the Diamond → Maniac artboard burns along the stage's: along the window's own, however
// wider or taller than the stage it is. Unseen until then.
export const TierUpBlaze = () => {
  const scale = useStageScale();

  return (
    <div
      data-tier-up="blaze"
      className="absolute opacity-0"
      style={{ ...windowOnStage(scale), boxShadow: MANIAC_PAINT.blaze }}
    >
      <div
        data-tier-up="blaze-flicker"
        className="size-full"
        style={{ boxShadow: MANIAC_PAINT.blazeFlicker }}
      />
    </div>
  );
};
