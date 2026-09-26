import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import type { Aura } from "@/components/aura/aura-paint";
import { TierBlasonDrawing } from "@/components/tier/tier-blason-drawing";

type TierBlasonProps = { tier: Tier; aura?: Aura };

// A Tier's Blason: its Emblem laid on its Ornament, shown large where the rank stands out, with
// its Aura, light unless asked full. Both grow from one Tier to the next. Only seen.
export const TierBlason = ({ tier, aura = "light" }: TierBlasonProps) => (
  <AuraFrame tier={tier} aura={aura} Drawing={TierBlasonDrawing} />
);
