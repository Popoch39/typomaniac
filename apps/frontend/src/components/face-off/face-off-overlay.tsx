import { type MouseEvent, useRef } from "react";

import { FaceOffAnnouncer } from "@/components/face-off/face-off-announcer";
import { FaceOffCount } from "@/components/face-off/face-off-count";
import { FaceOffMute } from "@/components/face-off/face-off-mute";
import { FaceOffOpponent } from "@/components/face-off/face-off-opponent";
import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import { FaceOffSelf } from "@/components/face-off/face-off-self";
import { useFaceOffTimeline } from "@/components/face-off/use-face-off-timeline";
import type { DuelOpponent } from "@/stores/duel-store";

type FaceOffOverlayProps = {
  opponent: DuelOpponent;
  pairing: FaceOffPairing;
  startsAt: number;
  elapsed: number;
};

// A click on the overlay never takes the focus from the typing area: it has it at GO.
const keepFocus = (event: MouseEvent) => event.preventDefault();

// The Face-off, over the whole app (navigation included): this User on the left, the opponent on
// the right, the VS, then the 3-2-1, on the Duel's clock. The stage shakes at the impact; the two
// panels cover the page until they split away on GO.
export const FaceOffOverlay = ({ opponent, pairing, startsAt, elapsed }: FaceOffOverlayProps) => {
  const scope = useRef<HTMLDivElement>(null);

  useFaceOffTimeline(scope, startsAt);

  return (
    <div
      ref={scope}
      role="presentation"
      className="fixed inset-0 z-[60] overflow-hidden max-lg:hidden"
      onMouseDown={keepFocus}
    >
      <div data-face-off="stage" className="absolute inset-0">
        <FaceOffSelf rank={pairing.selfRank} form={pairing.selfForm} />
        <FaceOffOpponent
          opponent={opponent}
          rank={pairing.opponentRank}
          form={pairing.opponentForm}
        />
        <FaceOffCount />
      </div>
      <FaceOffMute />
      <FaceOffAnnouncer elapsed={elapsed} opponentHandle={opponent.handle} />
    </div>
  );
};
