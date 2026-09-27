import type { Tier } from "ranked";

import { AuraFrame } from "@/components/aura/aura-frame";
import type { Aura } from "@/components/aura/aura-paint";
import { TierOrnamentDrawing } from "@/components/tier/drawing/tier-ornament-drawing";

type TierOrnamentProps = { tier: Tier; aura?: Aura };

// A Tier's Ornament alone, with its Aura, light unless asked full. Only seen.
export const TierOrnament = ({ tier, aura = "light" }: TierOrnamentProps) => (
  <AuraFrame tier={tier} aura={aura} Drawing={TierOrnamentDrawing} />
);
