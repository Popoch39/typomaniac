import { useState } from "react";
import { type Tier, TIERS } from "ranked";

import { hasFullAura } from "@/components/aura/aura-paint";
import { AuraGalleryTier } from "@/components/aura-gallery/aura-gallery-tier";

// The highest Tier with a full Aura, shown at first.
const HIGHEST_FULL = TIERS.findLast(hasFullAura) ?? null;

// The seven Tiers, one of them at most in full Aura: every Tier's full row together would pass
// `FULL_AURA_CAPACITY`, so choosing one hides the other, and choosing it again hides it.
export const AuraGalleryTiers = () => {
  const [full, setFull] = useState<Tier | null>(HIGHEST_FULL);

  const toggleFull = (tier: Tier) => setFull((shown) => (shown === tier ? null : tier));

  return TIERS.map((tier) => (
    <AuraGalleryTier key={tier} tier={tier} fullShown={full === tier} onToggleFull={toggleFull} />
  ));
};
