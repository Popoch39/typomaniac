import { cn } from "cn";
import type { Tier } from "ranked";

import { hasFullAura } from "@/components/aura/aura-paint";
import { AuraGalleryFull } from "@/components/aura-gallery/aura-gallery-full";
import { AuraGalleryRow } from "@/components/aura-gallery/aura-gallery-row";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";

// One Tier as the app shows it: with its light Aura at every size, then, for a Tier with one, its
// full Aura at the sizes shown large, when chosen.
export const AuraGalleryTier = ({
  tier,
  fullShown,
  onToggleFull,
}: {
  tier: Tier;
  fullShown: boolean;
  onToggleFull: (tier: Tier) => void;
}) => (
  <section
    aria-label={`Tier ${tier}`}
    className="flex flex-col gap-4 rounded-card bg-card px-8 py-6"
  >
    <h2 className={cn("text-lg font-extrabold", TIER_COLORS[tier])}>{TIER_NAMES[tier]}</h2>
    <AuraGalleryRow tier={tier} aura="light" />
    {hasFullAura(tier) ? (
      <AuraGalleryFull tier={tier} shown={fullShown} onToggle={onToggleFull} />
    ) : null}
  </section>
);
