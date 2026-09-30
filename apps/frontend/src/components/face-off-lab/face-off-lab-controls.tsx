import { XIcon } from "lucide-react";

import {
  type LabPairing,
  LAB_PAIRING_OPTIONS,
} from "@/components/face-off-lab/face-off-lab-pairings";
import {
  type LabOpening,
  LAB_OPENING_OPTIONS,
} from "@/components/face-off-lab/face-off-lab-openings";
import { FaceOffLabTimeline } from "@/components/face-off-lab/face-off-lab-timeline";
import type { ReplaySpeed } from "@/components/replay/replay-clock";
import { ReplayControls } from "@/components/replay/replay-controls";
import { ReplaySpeedPicker } from "@/components/replay/replay-speed-picker";
import { SettingGroup } from "@/components/settings/setting-group";
import { Button } from "@/components/ui/button";

type FaceOffLabControlsProps = {
  t: number;
  duration: number;
  playing: boolean;
  ended: boolean;
  speed: ReplaySpeed;
  pairing: LabPairing;
  opening: LabOpening;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSeek: (target: number) => void;
  onSpeed: (speed: ReplaySpeed) => void;
  onPairing: (pairing: LabPairing) => void;
  onOpening: (opening: LabOpening) => void;
  onClose: () => void;
};

// The lab's bar, over the Face-off: play, pause, the time since the pairing to the hundredth,
// scrubbed to the frame, the speed, both players' ranks and Forms, the card it opens from, and out.
export const FaceOffLabControls = ({
  t,
  duration,
  playing,
  ended,
  speed,
  pairing,
  opening,
  onPause,
  onResume,
  onRestart,
  onSeek,
  onSpeed,
  onPairing,
  onOpening,
  onClose,
}: FaceOffLabControlsProps) => (
  <div className="fixed bottom-6 left-1/2 z-[70] flex w-[min(64rem,calc(100vw-4rem))] -translate-x-1/2 items-center gap-4 rounded-card bg-card px-5 py-3 shadow-2xl">
    <ReplayControls
      playing={playing}
      ended={ended}
      onPause={onPause}
      onResume={onResume}
      onRestart={onRestart}
    />
    <FaceOffLabTimeline t={t} duration={duration} onSeek={onSeek} />
    <ReplaySpeedPicker speed={speed} onChange={onSpeed} />
    <SettingGroup
      label="Rangs et Forms"
      options={LAB_PAIRING_OPTIONS}
      value={pairing}
      onChange={onPairing}
    />
    <SettingGroup
      label="Ouverture"
      options={LAB_OPENING_OPTIONS}
      value={opening}
      onChange={onOpening}
    />
    <Button variant="ghost" size="icon" aria-label="Fermer le lab" onClick={onClose}>
      <XIcon />
    </Button>
  </div>
);
