import { useState } from "react";
import { createPortal } from "react-dom";

import { FaceOffLabControls } from "@/components/face-off-lab/face-off-lab-controls";
import {
  type LabPairing,
  LAB_OPPONENT,
  LAB_PAIRINGS,
} from "@/components/face-off-lab/face-off-lab-pairings";
import { FaceOffOverlay } from "@/components/face-off/face-off-overlay";
import { COUNTDOWN_S, EXIT_MS } from "@/components/face-off/face-off-timeline";
import { useReplayClock } from "@/components/replay/use-replay-clock";
import { ClockContext } from "@/components/run/clock-context";

// The lab's clock reads the time since the pairing: the Duel starts at the Countdown's end.
const STARTS_AT = COUNTDOWN_S * 1000;

const DURATION = STARTS_AT + EXIT_MS;

type FaceOffLabStageProps = { onClose: () => void };

// The Face-off as a Duel shows it, on a clock of the lab's own (the Replay's): played from the
// mount on, paused, scrubbed or slowed down, never tied to a Duel.
export const FaceOffLabStage = ({ onClose }: FaceOffLabStageProps) => {
  const replay = useReplayClock(DURATION);
  const [pairing, setPairing] = useState<LabPairing>("ranked");

  return createPortal(
    <>
      <ClockContext value={replay.playhead}>
        <FaceOffOverlay
          key={pairing}
          opponent={LAB_OPPONENT}
          pairing={LAB_PAIRINGS[pairing]}
          startsAt={STARTS_AT}
          elapsed={replay.t - STARTS_AT}
        />
      </ClockContext>
      <FaceOffLabControls
        t={replay.t}
        duration={DURATION}
        playing={replay.playing}
        ended={replay.ended}
        speed={replay.speed}
        pairing={pairing}
        onPause={replay.pause}
        onResume={replay.resume}
        onRestart={replay.restart}
        onSeek={replay.seek}
        onSpeed={replay.setSpeed}
        onPairing={setPairing}
        onClose={onClose}
      />
    </>,
    document.body,
  );
};
