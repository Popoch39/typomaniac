import type { Tier } from "ranked";

import type { Aura } from "@/components/aura/aura-paint";
import { AuraGalleryCell } from "@/components/aura-gallery/aura-gallery-cell";
import { AVATAR_SIZES, BLASON_SIZES } from "@/components/aura-gallery/aura-gallery-sizes";
import { TIER_NAMES } from "@/components/tier/tier";
import { TierBlason } from "@/components/tier/tier-blason";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

const LABELS: Record<Aura, string> = { light: "Aura légère", full: "Aura pleine" };

// One Tier with one Aura: its Ornament around an avatar at every size that Aura is shown at (all
// of them for the light one, the large ones for the full one), then its Blason at each of its
// sizes. Each cell holds the whole Ornament, so none overlaps its neighbour.
export const AuraGalleryRow = ({ tier, aura }: { tier: Tier; aura: Aura }) => (
  <section aria-label={`${LABELS[aura]} de ${tier}`} className="flex flex-wrap items-end gap-8">
    {AVATAR_SIZES.map((size) =>
      aura === "full" && !size.full ? null : (
        <AuraGalleryCell key={size.where} where={size.where} box={size.box}>
          <UserAvatar
            handle={TIER_NAMES[tier]}
            image={null}
            ornament={tier}
            aura={aura}
            className={size.avatar}
            fallbackClassName="bg-primary font-bold text-primary-foreground"
          />
        </AuraGalleryCell>
      ),
    )}
    {BLASON_SIZES.map((size) => (
      <AuraGalleryCell key={size.where} where={size.where} box={size.box}>
        <TierBlason tier={tier} aura={aura} />
      </AuraGalleryCell>
    ))}
  </section>
);
