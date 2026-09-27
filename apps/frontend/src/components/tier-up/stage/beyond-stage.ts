import { STAGE } from "@/components/tier-up/stage/stage-scale";

// A box reaching one stage past each edge of the stage, for a light that must go on past them
// into a window wider or taller than the stage (px on the stage), and where the Blason's centre
// is in it, for its gradients: 50 % across, 39 % down the stage, as the canvas's.
export const BEYOND_STAGE = {
  box: { left: -STAGE.width, top: -STAGE.height, width: STAGE.width * 3, height: STAGE.height * 3 },
  centre: `${STAGE.width * 1.5}px ${STAGE.height + STAGE.height * 0.39}px`,
} as const;

// The window itself, on the stage scaled by `scale` (and always at least as large as it): for a
// light along the window's edges, where the canvas lights the stage's.
export const windowOnStage = (scale: number) => ({
  left: `calc(${STAGE.width / 2}px - ${50 / scale}vw)`,
  top: `calc(${STAGE.height / 2}px - ${50 / scale}vh)`,
  width: `${100 / scale}vw`,
  height: `${100 / scale}vh`,
});
