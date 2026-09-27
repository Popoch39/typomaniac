// The Tier-up is drawn on a stage of this size, as in its canvas, then scaled to the window.
export const STAGE = { width: 1440, height: 900 } as const;

// How much the stage is scaled so that it fits whole in a window of `width` × `height`, never cut:
// down in a smaller window, up in a larger one.
export const stageScale = (width: number, height: number) =>
  Math.min(width / STAGE.width, height / STAGE.height);
