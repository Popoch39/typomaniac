import { type ComponentProps, useRef } from "react";

import { DuelHud } from "@/components/duel-hud/duel-hud";
import { useHudFromRoundBreak } from "@/components/round-break/use-hud-from-round-break";

// The HUD of the Round being played: at the GO after a Round break, it comes out of it.
export const DuelRoundHud = (props: ComponentProps<typeof DuelHud>) => {
  const ref = useRef<HTMLDivElement>(null);

  useHudFromRoundBreak(ref);

  return (
    <div ref={ref} className="flex flex-1 flex-col">
      <DuelHud {...props} />
    </div>
  );
};
