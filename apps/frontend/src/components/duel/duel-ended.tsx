import { DuelOutcome } from "@/components/duel/duel-outcome";
import { PlayerResult } from "@/components/duel/player-result";
import { Button } from "@/components/ui/button";
import { type DuelEnding, useDuelStore } from "@/stores/duel-store";

// Called once with the node on mount: the typing input is gone with the Duel.
const focusOnMount = (node: HTMLElement | null) => node?.focus();

// The server ended the Duel: its outcome and both Scores and Results, the same on both screens, then
// Nouveau Duel to join the Queue again.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const joinQueue = useDuelStore((store) => store.joinQueue);

  return (
    <div ref={focusOnMount} tabIndex={-1} className="flex flex-col gap-8 outline-none">
      <DuelOutcome
        outcome={ending.outcome}
        forfeit={ending.forfeit}
        opponent={ending.opponent.name}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <PlayerResult name="Toi" result={ending.result} score={ending.score} />
        <PlayerResult
          name={ending.opponent.name}
          result={ending.opponentResult}
          score={ending.opponentScore}
          opponent
        />
      </div>
      <div>
        <Button variant="outline" onClick={joinQueue}>
          Nouveau Duel
        </Button>
      </div>
    </div>
  );
};
