import { XIcon } from "lucide-react";

import { type LabRank, LAB_RANK_OPTIONS } from "@/components/face-off-lab/face-off-lab-ranks";
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
  rank: LabRank;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSeek: (target: number) => void;
  onSpeed: (speed: ReplaySpeed) => void;
  onRank: (rank: LabRank) => void;
  onClose: () => void;
};

// The lab's bar, over the Face-off: play, pause, the time since the pairing to the hundredth,
// scrubbed to the frame, the speed, the opponent's rank, and out.
export const FaceOffLabControls = ({
  t,
  duration,
  playing,
  ended,
  speed,
  rank,
  onPause,
  onResume,
  onRestart,
  onSeek,
  onSpeed,
  onRank,
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
      label="Rang de l'adversaire"
      options={LAB_RANK_OPTIONS}
      value={rank}
      onChange={onRank}
    />
    <Button variant="ghost" size="icon" aria-label="Fermer le lab" onClick={onClose}>
      <XIcon />
    </Button>
  </div>
);
