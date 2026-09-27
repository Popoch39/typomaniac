import { cn } from "cn";
import type { ReactNode } from "react";

import { DuelClock } from "@/components/duel/duel-clock";
import { DuelConnection } from "@/components/duel/duel-connection";
import { DuelText } from "@/components/duel/duel-text";
import { LeaveDuel } from "@/components/duel/leave-duel";
import { OpponentWpm } from "@/components/duel/opponent-wpm";
import { PlayerLiveScore } from "@/components/duel/player-live-score";
import type { DuelHudModel } from "@/components/duel-hud/duel-hud-model";
import { atHandle } from "@/lib/at-handle";

type DuelHudProps = {
  model: DuelHudModel;
  // Over the Text's card, e.g. the veil of a typing input that lost the focus; null for none.
  veil: ReactNode;
  onLeave: () => void;
};

// The Duel's HUD from the Countdown to the end, drawn from its model alone, never from the store:
// the Duel played in this tab feeds it, and so does a scripted one. Laid out on the Duel's scene
// as its board is: room above the HUD, a little more below it, then Quitter le Duel.
export const DuelHud = ({ model, veil, onLeave }: DuelHudProps) => {
  const { self, opponent, elapsed } = model;
  const opponentLabel = atHandle(opponent.handle);

  return (
    <div className="flex flex-1 flex-col">
      <div className="grow" />
      <div className="flex flex-col gap-4">
        <DuelConnection
          opponent={opponentLabel}
          connected={self.connected}
          opponentConnected={opponent.connected}
        />
        <div className="flex items-baseline justify-between">
          <DuelClock elapsed={elapsed} seconds={model.seconds} />
          <OpponentWpm name={opponentLabel} run={opponent.run} elapsed={elapsed} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PlayerLiveScore name="Toi" score={self.score} />
          <PlayerLiveScore name={opponentLabel} score={opponent.score} opponent />
        </div>
        <div className="relative rounded-card bg-card px-8 py-6">
          {/* Unpainted until the start, so no one reads it ahead; it keeps its place, so nothing
              moves as the Face-off's panels split away on GO. */}
          <div className={cn(elapsed < 0 && "invisible")}>
            <DuelText
              run={self.run}
              lastBurst={self.score.lastBurst}
              opponentRun={opponent.run}
              opponentHandle={opponent.handle}
            />
          </div>
          {veil}
        </div>
      </div>
      <div className="grow-[1.3]" />
      <div className="flex justify-center">
        <LeaveDuel connected={self.connected} onLeave={onLeave} />
      </div>
    </div>
  );
};
