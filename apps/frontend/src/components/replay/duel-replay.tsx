import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { ReplayControls } from "@/components/replay/replay-controls";
import { ReplayHeader } from "@/components/replay/replay-header";
import { ReplayPlayback } from "@/components/replay/replay-playback";
import { ReplayResults } from "@/components/replay/replay-results";
import { ReplaySidePicker } from "@/components/replay/replay-side-picker";
import { type ReplayView, replayDuration } from "@/components/replay/replay-sides";
import { ReplaySpeedPicker } from "@/components/replay/replay-speed-picker";
import { ReplayTimeline } from "@/components/replay/replay-timeline";
import { useReplayClock } from "@/components/replay/use-replay-clock";
import { opponentName } from "@/lib/opponent-name";

// A finished Duel played again Keystroke by Keystroke, at the pace it was typed, from the start on:
// both Runs rebuilt at each instant, all in the browser. The User moves through it with the time
// bar, picks its speed and whose Run it shows. At the end, both Results and Scores.
export const DuelReplay = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));
  const duration = replayDuration(duel);

  const { t, playing, ended, speed, pause, resume, restart, seek, setSpeed } =
    useReplayClock(duration);

  const [view, setView] = useState<ReplayView>("own");

  return (
    <div className="flex flex-col gap-6">
      <ReplayHeader duel={duel} />
      {ended ? <ReplayResults duel={duel} /> : <ReplayPlayback duel={duel} t={t} view={view} />}
      <ReplayTimeline t={t} duration={duration} onSeek={seek} />
      <div className="flex flex-wrap items-center gap-6">
        <ReplayControls
          playing={playing}
          ended={ended}
          onPause={pause}
          onResume={resume}
          onRestart={restart}
        />
        <ReplaySpeedPicker speed={speed} onChange={setSpeed} />
        {duel.opponent === null || ended ? null : (
          <ReplaySidePicker
            view={view}
            opponentName={opponentName(duel.opponent)}
            onChange={setView}
          />
        )}
      </div>
    </div>
  );
};
