import { useState } from "react";

import type { ReplayedDuel } from "@/api/duel-history";
import type { DuelAverage } from "@/components/replay/duel-result-lines";
import { ReplayControls } from "@/components/replay/replay-controls";
import { ReplayForfeitMarker } from "@/components/replay/replay-forfeit-marker";
import { ReplayLecture } from "@/components/replay/replay-lecture";
import { ReplayPlayback } from "@/components/replay/replay-playback";
import { ReplayResults } from "@/components/replay/replay-results";
import { ReplaySidePicker } from "@/components/replay/replay-side-picker";
import { type ReplayView, replayDuration } from "@/components/replay/replay-sides";
import { ReplaySpeedPicker } from "@/components/replay/replay-speed-picker";
import { ReplayStats } from "@/components/replay/replay-stats";
import { ReplayTimeline } from "@/components/replay/replay-timeline";
import { useReplayClock } from "@/components/replay/use-replay-clock";
import { opponentName } from "@/lib/opponent-name";
import { useLocale } from "@/locale/use-locale";

// One Round of a finished Duel (its only one, before the Bo3) played again Keystroke by Keystroke,
// at the pace it was typed, from its start on: both Runs rebuilt at each instant, all in the
// browser. Both Score cards and the Text, then the Lecture card: the User moves through it with
// the time bar, picks its speed and whose Run it shows. At the end, both Results and Scores. Under
// it all, the Round's chart and Results, whatever the time, a Bo3's with the Duel's average. The
// Round a Forfeit cut short stops there, marked under the time bar.
export const ReplayRound = ({
  duel,
  average,
}: {
  duel: ReplayedDuel;
  average: DuelAverage | null;
}) => {
  const duration = replayDuration(duel);

  const { t, playing, ended, speed, pause, resume, restart, seek, setSpeed } =
    useReplayClock(duration);

  const [view, setView] = useState<ReplayView>("own");
  const locale = useLocale();

  return (
    <>
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
              opponentName={opponentName(duel.opponent, locale)}
              onChange={setView}
            />
          )}
        </div>
      </ReplayLecture>
      <ReplayStats duel={duel} average={average} />
    </>
  );
};
