import { DuelOutcome } from "@/components/duel/duel-outcome";
import { PlayerResult } from "@/components/duel/player-result";
import { ReplayDuelLink } from "@/components/duel/replay-duel-link";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { type DuelEnding, useDuelStore } from "@/stores/duel-store";

// Called once with the node on mount: the typing input is gone with the Duel.
const focusOnMount = (node: HTMLElement | null) => node?.focus();

// The server ended the Duel: its outcome and both Scores and Results, the same on both screens, then
// Nouveau Duel to join the Queue again, and Revoir to replay it once written.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const joinQueue = useDuelStore((store) => store.joinQueue);
  const opponent = atHandle(ending.opponent.handle);

  return (
    <div ref={focusOnMount} tabIndex={-1} className="flex flex-col gap-8 outline-none">
      <DuelOutcome outcome={ending.outcome} forfeit={ending.forfeit} opponent={opponent} />
      <div className="grid gap-8 md:grid-cols-2">
        <PlayerResult name="Toi" result={ending.result} score={ending.score} />
        <PlayerResult
          name={opponent}
          result={ending.opponentResult}
          score={ending.opponentScore}
          opponent
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={joinQueue}>
          Nouveau Duel
        </Button>
        {ending.duelId === null ? null : <ReplayDuelLink duelId={ending.duelId} />}
      </div>
    </div>
  );
};
