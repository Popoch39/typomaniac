import type { Standing } from "ranked";
import type { MouseEvent, RefObject } from "react";

import { TierUpName } from "@/components/tier-up/caption/tier-up-name";
import { TierUpRoute } from "@/components/tier-up/caption/tier-up-route";
import type { NameLook } from "@/components/tier-up/choreography/tier-up-choreography";
import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";
import { Button } from "@/components/ui/button";

type TierUpCaptionProps = {
  from: Standing;
  to: Standing;
  proceed: RefObject<HTMLButtonElement | null>;
  onProceed: (event: MouseEvent) => void;
  // How the name is set, as its artboard sets it.
  look: NameLook;
};

// What the Tier-up says under the Blason: « Nouveau palier » (« Palier ultime » for Maniac), the
// Tier's name, the route of the rank, then « Continuer » in the Tier's metal. All of it is there
// from the start, for screen readers: the timeline only brings it into sight.
export const TierUpCaption = ({ from, to, proceed, onProceed, look }: TierUpCaptionProps) => (
  <div className="absolute top-[556px] left-0 flex w-[1440px] flex-col items-center gap-3.5 text-center">
    <p
      data-tier-up="kicker"
      className="font-mono text-sm leading-[normal] tracking-[0.42em] text-muted-foreground uppercase"
    >
      {to.tier === "maniac" ? "Palier ultime" : "Nouveau palier"}
    </p>
    <TierUpName tier={to.tier} look={look} />
    <TierUpRoute from={from} to={to} />
    <Button
      ref={proceed}
      data-tier-up="continue"
      className="mt-4 h-13 rounded-full px-[34px] text-[17px] font-bold text-background"
      style={{ backgroundColor: tierUpPaint(to.tier).mid }}
      onClick={onProceed}
    >
      Continuer
    </Button>
  </div>
);
