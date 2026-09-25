import { type MouseEvent, useRef } from "react";
import type { Rank } from "ranked";

import { FaceOffAnnouncer } from "@/components/face-off/face-off-announcer";
import { FaceOffCount } from "@/components/face-off/face-off-count";
import { FaceOffOpponent } from "@/components/face-off/face-off-opponent";
import { FaceOffSelf } from "@/components/face-off/face-off-self";
import { useFaceOffTimeline } from "@/components/face-off/use-face-off-timeline";
import type { DuelOpponent } from "@/stores/duel-store";

type FaceOffOverlayProps = {
  opponent: DuelOpponent;
  opponentRank: Rank | null;
  startsAt: number;
  elapsed: number;
};

// A click on the overlay never takes the focus from the typing area: it has it at GO.
const keepFocus = (event: MouseEvent) => event.preventDefault();

// The Face-off, over the whole app (navigation included): this User on the left, the opponent on
// the right, the VS, then the 3-2-1, on the Duel's clock. The stage shakes at the impact; the ink
// backdrop behind it hides the page meanwhile.
export const FaceOffOverlay = ({
  opponent,
  opponentRank,
  startsAt,
  elapsed,
}: FaceOffOverlayProps) => {
  const scope = useRef<HTMLDivElement>(null);

  useFaceOffTimeline(scope, startsAt);

  return (
    <div
      ref={scope}
      role="presentation"
      className="fixed inset-0 z-[60] overflow-hidden max-lg:hidden"
      onMouseDown={keepFocus}
    >
      <div data-face-off="backdrop" className="invisible absolute inset-0 bg-background" />
      <div data-face-off="stage" className="absolute inset-0">
        <FaceOffSelf />
        <FaceOffOpponent opponent={opponent} rank={opponentRank} />
        <FaceOffCount />
      </div>
      <FaceOffAnnouncer elapsed={elapsed} opponentHandle={opponent.handle} />
    </div>
  );
};
