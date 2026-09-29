import { ArrowRightIcon } from "lucide-react";
import type { Standing } from "ranked";

import { standingName } from "@/components/tier/tier";
import { METALS } from "@/components/tier/sprite/tier-sprite-paint";

type TierUpRouteProps = {
  from: Standing;
  to: Standing;
  // The arrow's colour: muted, unless its artboard lights it.
  arrow?: string;
};

// The rank left and the rank reached, each in its Tier's metal: « Iron I → Bronze IV ».
export const TierUpRoute = ({ from, to, arrow }: TierUpRouteProps) => (
  <p data-tier-up="route" className="flex items-center gap-3.5 font-mono text-lg leading-[normal]">
    <span style={{ color: METALS[from.tier].mid }}>{standingName(from)}</span>
    <ArrowRightIcon
      aria-hidden
      className="size-[18px] text-muted-foreground"
      style={{ color: arrow }}
    />
    <span className="sr-only"> → </span>
    <span style={{ color: METALS[to.tier].mid }}>{standingName(to)}</span>
  </p>
);
