import { useState } from "react";

import { FaceOffLabStage } from "@/components/face-off-lab/face-off-lab-stage";
import { Button } from "@/components/ui/button";

// Out of the production build: a button that plays the Face-off on demand, to tune its animation
// without a Duel. Each opening plays it from the pairing.
export const FaceOffLab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-20 z-50"
        onClick={() => setOpen(true)}
      >
        Face-off
      </Button>
      {open ? <FaceOffLabStage onClose={() => setOpen(false)} /> : null}
    </>
  );
};
