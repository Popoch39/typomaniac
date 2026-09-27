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

type TierUpPopupProps = { from: Standing; to: Standing; onClose: () => void };

// The Tier-up's popup and its stage. Its own component, rendered inside the portal: Base UI only
// renders the portal's content once its container exists, a render after the dialog's, so the
// timeline is built here, where the stage is already there to be animated.
export const TierUpPopup = ({ from, to, onClose }: TierUpPopupProps) => {
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

  // Échap advances wherever the focus is; Entrée only on the dialog itself: on « Continuer », it
  // is the button's own click.
  const pressed = (event: KeyboardEvent) => {
    const onDialog = event.target === event.currentTarget;

    if (event.key === "Escape" || (event.key === "Enter" && onDialog)) {
      event.preventDefault();
      advance();
    }
  };

  const proceeded = (event: MouseEvent) => {
    event.stopPropagation();
    onClose();
  };

  return (
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
  );
};
