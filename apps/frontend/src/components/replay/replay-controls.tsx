import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReplayControlsProps = {
  playing: boolean;
  ended: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
};

// Pause and play while the Replay runs, play it again from the start once it is over.
export const ReplayControls = ({
  playing,
  ended,
  onPause,
  onResume,
  onRestart,
}: ReplayControlsProps) => {
  if (ended) {
    return (
      <Button variant="outline" onClick={onRestart}>
        <RotateCcwIcon aria-hidden="true" />
        Revoir depuis le début
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={playing ? onPause : onResume}>
      {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
      {playing ? "Pause" : "Lecture"}
    </Button>
  );
};
