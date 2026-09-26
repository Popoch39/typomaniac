import { cn } from "cn";
import type { Tier } from "ranked";

import { AuraGalleryCell } from "@/components/aura-gallery/aura-gallery-cell";
import { AVATAR_SIZES, BLASON_SIZES } from "@/components/aura-gallery/aura-gallery-sizes";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";
import { TierBlason } from "@/components/tier/tier-blason";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

// One Tier as the app shows it: its Ornament around an avatar at every size, then its Blason at
// each of its sizes. Each cell holds the whole Ornament, so none overlaps its neighbour.
export const AuraGalleryTier = ({ tier }: { tier: Tier }) => (
  <section
    aria-label={`Tier ${tier}`}
    className="flex flex-col gap-4 rounded-card bg-card px-8 py-6"
  >
    <h2 className={cn("text-lg font-extrabold", TIER_COLORS[tier])}>{TIER_NAMES[tier]}</h2>
    <div className="flex flex-wrap items-end gap-8">
      {AVATAR_SIZES.map((size) => (
        <AuraGalleryCell key={size.where} where={size.where} box={size.box}>
          <UserAvatar
            handle={TIER_NAMES[tier]}
            image={null}
            ornament={tier}
            className={size.avatar}
            fallbackClassName="bg-primary font-bold text-primary-foreground"
          />
        </AuraGalleryCell>
      ))}
      {BLASON_SIZES.map((size) => (
        <AuraGalleryCell key={size.where} where={size.where} box={size.box}>
          <TierBlason tier={tier} />
        </AuraGalleryCell>
      ))}
    </div>
  </section>
);
