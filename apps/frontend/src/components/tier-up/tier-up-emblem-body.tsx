import type { Tier } from "ranked";

import { EMBLEM_LAYERS } from "@/components/tier/tier-emblem-layers";

// The metal body of a Tier's Emblem, on its 32 × 32 grid, filling its box: what fills in the
// traced outline. Drawn for the Aura frame, which may light it from behind; it has no light of
// its own to leave out.
export const TierUpEmblemBody = ({ tier }: { tier: Tier }) => (
  <svg viewBox="0 0 32 32" className="size-full overflow-visible" aria-hidden>
    {EMBLEM_LAYERS[tier].body}
  </svg>
);
