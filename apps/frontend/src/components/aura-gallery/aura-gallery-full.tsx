import { useState } from "react";
import type { Tier } from "ranked";

import { AuraGalleryRow } from "@/components/aura-gallery/aura-gallery-row";
import { Button } from "@/components/ui/button";

// A Tier's full Aura, shown on demand only: the app holds `FULL_AURA_CAPACITY` at most, fewer
// than every Tier's row together, so each is mounted while asked for and gives its places back
// once hidden.
export const AuraGalleryFull = ({ tier }: { tier: Tier }) => {
  const [shown, setShown] = useState(false);

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
