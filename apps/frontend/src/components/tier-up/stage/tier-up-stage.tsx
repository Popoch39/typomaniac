import type { ReactNode, RefObject } from "react";

import { useStageScale } from "@/components/tier-up/stage/use-stage-scale";

type TierUpStageProps = { ref: RefObject<HTMLDivElement | null>; children: ReactNode };

// The Tier-up's 1440 × 900 stage, as in its canvas, centred and scaled to fit the window whole:
// every part is placed on it in the canvas's pixels.
export const TierUpStage = ({ ref, children }: TierUpStageProps) => {
  const scale = useStageScale();

  return (
    <div
      ref={ref}
      data-tier-up="stage"
      className="absolute top-1/2 left-1/2 h-[900px] w-[1440px] overflow-hidden"
      style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
    >
      {children}
    </div>
  );
};
