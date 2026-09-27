import { Dialog } from "@base-ui/react/dialog";
import type { Standing } from "ranked";
import { type KeyboardEvent, type MouseEvent, useRef, useState } from "react";

import { reducedMotion, useForcedReducedMotion } from "@/components/motion/reduced-motion-context";
import { TierUpBlason } from "@/components/tier-up/tier-up-blason";
import { TierUpCaption } from "@/components/tier-up/tier-up-caption";
import { TierUpGround } from "@/components/tier-up/tier-up-ground";
import { TierUpHalo } from "@/components/tier-up/tier-up-halo";
import { TierUpOldEmblem } from "@/components/tier-up/tier-up-old-emblem";
import { TierUpSparks } from "@/components/tier-up/tier-up-sparks";
import { TierUpStage } from "@/components/tier-up/tier-up-stage";
import { useTierUpTimeline } from "@/components/tier-up/use-tier-up-timeline";

type TierUpProps = {
  // The rank left and the rank reached, in another Tier or Maniac.
  from: Standing;
  to: Standing;
  // To unmount it: where the focus goes then is the caller's to say.
  onClose: () => void;
};

// A User moving up into a new Tier or Maniac: the whole screen, a modal dialog named by the Tier
// reached, over a page left inert. The old Emblem comes apart, the new Blason lands, then its
// name, the route of the rank and « Continuer », as its Tier's choreography plays it. A click,
// Échap or Entrée goes straight to the end; once there, the same, or « Continuer », closes it.
// Under reduced motion (preferred, or forced), it opens at its end, still.
export const TierUp = ({ from, to, onClose }: TierUpProps) => {
  const forced = useForcedReducedMotion();
  const [still] = useState(() => reducedMotion(forced));
  const stage = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const proceed = useRef<HTMLButtonElement>(null);

  const { settled, skip } = useTierUpTimeline(stage, {
    tier: to.tier,
    reducedMotion: still,
    proceed,
  });

  const advance = () => (settled ? onClose() : skip());

  // Base UI keeps Échap for itself: it asks to close, and the Tier-up advances instead.
  const dismissed = (_open: boolean, { reason }: Dialog.Root.ChangeEventDetails) => {
    if (reason === "escape-key") {
      advance();
    }
  };

  // Entrée on « Continuer » is its own click: only Entrée on the dialog itself advances.
  const pressed = (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.target === event.currentTarget) {
      event.preventDefault();
      advance();
    }
  };

  const proceeded = (event: MouseEvent) => {
    event.stopPropagation();
    onClose();
  };

  return (
    <Dialog.Root open onOpenChange={dismissed}>
      <Dialog.Portal>
        <Dialog.Popup
          ref={popup}
          initialFocus={still ? proceed : popup}
          finalFocus={false}
          className="fixed inset-0 z-[60] overflow-hidden bg-background text-foreground outline-none"
          onClick={advance}
          onKeyDown={pressed}
        >
          <TierUpStage ref={stage}>
            <TierUpGround tier={to.tier} />
            <TierUpHalo tier={to.tier} />
            <TierUpSparks tier={to.tier} />
            <TierUpOldEmblem tier={from.tier} />
            <TierUpBlason tier={to.tier} />
            <TierUpCaption from={from} to={to} proceed={proceed} onProceed={proceeded} />
          </TierUpStage>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
