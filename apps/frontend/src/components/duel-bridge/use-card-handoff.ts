import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

import type { BridgeCard } from "@/components/duel-bridge/bridge-card";

gsap.registerPlugin(useGSAP);

// The copy of the card fades out this long as the Face-off comes in over it.
const HANDOFF_S = 0.2;

// Once the Countdown starts (`handedOff`), the copy of the card the Duel came from fades out
// under the Face-off coming in, then goes. Reverted if the bridge lets go first: the bridge takes
// the copy off with it.
export const useCardHandoff = (card: BridgeCard | null, handedOff: boolean) => {
  useGSAP(
    () => {
      if (card === null || !handedOff) {
        return;
      }

      gsap.to(card.node, {
        autoAlpha: 0,
        duration: HANDOFF_S,
        ease: "power1.out",
        onComplete: () => card.node.remove(),
      });
    },
    { dependencies: [card, handedOff] },
  );
};
