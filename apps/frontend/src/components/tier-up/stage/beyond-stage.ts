import { STAGE } from "@/components/tier-up/stage/stage-scale";

// A box reaching one stage past each edge of the stage, for a light that must go on past them
// into a window wider or taller than the stage (px on the stage), and where the Blason's centre
// is in it, for its gradients: 50 % across, 39 % down the stage, as the canvas's.
export const BEYOND_STAGE = {
  box: { left: -STAGE.width, top: -STAGE.height, width: STAGE.width * 3, height: STAGE.height * 3 },
  centre: `${STAGE.width * 1.5}px ${STAGE.height + STAGE.height * 0.39}px`,
} as const;
