import { useSuspenseQuery } from "@tanstack/react-query";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { ReplayControls } from "@/components/replay/replay-controls";
import { ReplayHeader } from "@/components/replay/replay-header";
import { ReplayPlayback } from "@/components/replay/replay-playback";
import { ReplayResults } from "@/components/replay/replay-results";
import { replayDuration } from "@/components/replay/replay-sides";
import { useReplayClock } from "@/components/replay/use-replay-clock";

// A finished Duel played again Keystroke by Keystroke, at the pace it was typed, from the start on:
// both Runs rebuilt at each instant, all in the browser. At the end, both Results and Scores.
export const DuelReplay = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));
  const { t, playing, ended, pause, resume, restart } = useReplayClock(replayDuration(duel));

  return (
    <div className="flex flex-col gap-6">
      <ReplayHeader duel={duel} />
      {ended ? <ReplayResults duel={duel} /> : <ReplayPlayback duel={duel} t={t} />}
      <div>
        <ReplayControls
          playing={playing}
          ended={ended}
          onPause={pause}
          onResume={resume}
          onRestart={restart}
        />
      </div>
    </div>
  );
};
