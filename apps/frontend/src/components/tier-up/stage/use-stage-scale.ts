import { useSyncExternalStore } from "react";

import { stageScale } from "@/components/tier-up/stage/stage-scale";

const subscribe = (onResize: () => void) => {
  window.addEventListener("resize", onResize);

  return () => window.removeEventListener("resize", onResize);
};

const windowScale = () => stageScale(window.innerWidth, window.innerHeight);

// How much the Tier-up's stage is scaled to fit the window, followed as it is resized.
export const useStageScale = () => useSyncExternalStore(subscribe, windowScale);
