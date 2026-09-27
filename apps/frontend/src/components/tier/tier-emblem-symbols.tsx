import { TIERS } from "ranked";

import { EMBLEM_LAYERS } from "@/components/tier/tier-emblem-layers";
import { EMBLEM_OUTLINES } from "@/components/tier/tier-emblem-outline";
import { emblemId } from "@/components/tier/tier-sprite-paint";

// One symbol per Tier's Emblem, for the sprite: both its layers, placed on the 120 grid.
export const TierEmblemSymbols = () =>
  TIERS.map((tier) => (
    <symbol key={tier} id={emblemId(tier)} viewBox="0 0 120 120">
      <g transform={EMBLEM_OUTLINES[tier].transform}>
        {EMBLEM_LAYERS[tier].body}
        {EMBLEM_LAYERS[tier].engraving}
      </g>
    </symbol>
  ));
