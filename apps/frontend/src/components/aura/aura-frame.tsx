import type { Tier } from "ranked";

import { type Aura, hasFullAura } from "@/components/aura/aura-paint";
import { FullAuraFrame, type OrnamentDrawing } from "@/components/aura/full-aura-frame";

type AuraFrameProps = { tier: Tier; aura: Aura; Drawing: OrnamentDrawing };

// An Ornament with the Aura asked for: the full one where its Tier has one, else the light one,
// which is the drawing alone (the sheen and sparks are part of it), glow included.
export const AuraFrame = ({ tier, aura, Drawing }: AuraFrameProps) =>
  aura === "full" && hasFullAura(tier) ? (
    <FullAuraFrame tier={tier} Drawing={Drawing} />
  ) : (
    <Drawing tier={tier} glow />
  );
