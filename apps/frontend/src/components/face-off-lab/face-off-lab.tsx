import { useState } from "react";

import { FaceOffLabStage } from "@/components/face-off-lab/face-off-lab-stage";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { Button } from "@/components/ui/button";

// A button that plays the Face-off on demand, to tune its animation without a Duel. Each opening
// plays it from the pairing.
export const FaceOffLab = () => {
  const [open, setOpen] = useState(false);
  const { unlock: unlockSounds } = useFaceOffSounds();

  // Like the click that searches for a Duel, this one lets the Face-off sound.
  const openLab = () => {
    unlockSounds();
    setOpen(true);
  };

  return (
    <>
      <Button variant="outline" className="self-start" onClick={openLab}>
        Face-off
      </Button>
      {open ? <FaceOffLabStage onClose={() => setOpen(false)} /> : null}
    </>
  );
};
