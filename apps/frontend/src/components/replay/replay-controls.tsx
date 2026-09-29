import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

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
  const locale = useLocale();

  if (ended) {
    return (
      <Button variant="outline" onClick={onRestart}>
        <RotateCcwIcon aria-hidden="true" />
        {m.replay_restart({}, { locale })}
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={playing ? onPause : onResume}>
      {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
      {playing ? m.replay_pause({}, { locale }) : m.replay_play({}, { locale })}
    </Button>
  );
};
