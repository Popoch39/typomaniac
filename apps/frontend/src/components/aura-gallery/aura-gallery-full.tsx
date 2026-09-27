import type { Tier } from "ranked";

import { AuraGalleryRow } from "@/components/aura-gallery/aura-gallery-row";
import { Button } from "@/components/ui/button";

// A Tier's full Aura, shown only while its button is pressed: one Tier at a time, so its whole
// row fits within `FULL_AURA_CAPACITY` and never falls back to light.
export const AuraGalleryFull = ({
  tier,
  shown,
  onToggle,
}: {
  tier: Tier;
  shown: boolean;
  onToggle: (tier: Tier) => void;
}) => (
  <>
    <Button
      variant="outline"
      aria-pressed={shown}
      className="self-start"
      onClick={() => onToggle(tier)}
    >
      Aura pleine
    </Button>
    {shown ? <AuraGalleryRow tier={tier} aura="full" /> : null}
  </>
);
