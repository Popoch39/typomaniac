import { useState } from "react";
import type { Tier } from "ranked";

import { AuraGalleryRow } from "@/components/aura-gallery/aura-gallery-row";
import { Button } from "@/components/ui/button";

// A Tier's full Aura, shown at first, hidden on demand: the app holds `FULL_AURA_CAPACITY` at
// most, fewer than every Tier's row together (the last ones fall back to light), so hiding a
// row gives its places back to the others.
export const AuraGalleryFull = ({ tier }: { tier: Tier }) => {
  const [shown, setShown] = useState(true);

  return (
    <>
      <Button
        variant="outline"
        aria-pressed={shown}
        className="self-start"
        onClick={() => setShown((was) => !was)}
      >
        Aura pleine
      </Button>
      {shown ? <AuraGalleryRow tier={tier} aura="full" /> : null}
    </>
  );
};
