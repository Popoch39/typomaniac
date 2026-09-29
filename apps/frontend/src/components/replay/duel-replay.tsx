import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { ReplayControls } from "@/components/replay/replay-controls";
import { ReplayForfeitMarker } from "@/components/replay/replay-forfeit-marker";
import { ReplayHeader } from "@/components/replay/replay-header";
import { ReplayLecture } from "@/components/replay/replay-lecture";
import { ReplayPlayback } from "@/components/replay/replay-playback";
import { ReplayResults } from "@/components/replay/replay-results";
import { ReplaySidePicker } from "@/components/replay/replay-side-picker";
import { type ReplayView, replayDuration } from "@/components/replay/replay-sides";
import { ReplaySpeedPicker } from "@/components/replay/replay-speed-picker";
import { ReplayTimeline } from "@/components/replay/replay-timeline";
import { useReplayClock } from "@/components/replay/use-replay-clock";
import { opponentName } from "@/lib/opponent-name";

// A finished Duel played again Keystroke by Keystroke, at the pace it was typed, from the start on:
// both Runs rebuilt at each instant, all in the browser. Under its header, both Score cards and the
// Text, then the Lecture card: the User moves through it with the time bar, picks its speed and
// whose Run it shows. At the end, both Results and Scores. A forfeited Duel stops at its Forfeit,
// marked under the time bar.
export const DuelReplay = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));
  const duration = replayDuration(duel);

  const { t, playing, ended, speed, pause, resume, restart, seek, setSpeed } =
    useReplayClock(duration);

  const [view, setView] = useState<ReplayView>("own");

  return (
    <div className="flex flex-col gap-5">
      <ReplayHeader duel={duel} />
      {ended ? <ReplayResults duel={duel} /> : <ReplayPlayback duel={duel} t={t} view={view} />}
      <ReplayLecture>
        <ReplayTimeline t={t} duration={duration} onSeek={seek} />
        <ReplayForfeitMarker duel={duel} />
        <div className="flex items-center gap-4">
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
      </ReplayLecture>
    </div>
  );
};
