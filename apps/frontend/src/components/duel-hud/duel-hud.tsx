import { cn } from "cn";
import type { ReactNode } from "react";

import { DuelConnection } from "@/components/duel/duel-connection";
import { LeaveDuel } from "@/components/duel/leave-duel";
import { DuelBand } from "@/components/duel-hud/duel-band";
import type { DuelHudModel } from "@/components/duel-hud/duel-hud-model";
import { DuelText } from "@/components/duel-hud/duel-text";
import { atHandle } from "@/lib/at-handle";

type DuelHudProps = {
  model: DuelHudModel;
  // Over the Text's card, e.g. the veil of a typing input that lost the focus; null for none.
  veil: ReactNode;
  onLeave: () => void;
};

// The Duel's HUD from the Countdown to the end, drawn from its model alone, never from the store:
// the Duel played in this tab feeds it, and so does a scripted one. Laid out on the Duel's scene
// as its board is: room above the HUD, the band, the room of the Callouts under it (the lost
// connection's message for now), the Text's card, a little more room, then Quitter le Duel.
export const DuelHud = ({ model, veil, onLeave }: DuelHudProps) => {
  const { self, opponent, elapsed } = model;

  return (
    <div className="flex flex-1 flex-col">
      <div className="grow" />
      <DuelBand model={model} />
      <div className="mt-3 flex h-12 items-center justify-center">
        <DuelConnection
          opponent={atHandle(opponent.handle)}
          connected={self.connected}
          opponentConnected={opponent.connected}
        />
      </div>
      <div className="relative mt-3.5 rounded-card bg-card px-14 py-10">
        {/* Unpainted until the start, so no one reads it ahead; it keeps its place, so nothing
            moves as the Face-off's panels split away on GO. */}
        <div className={cn(elapsed < 0 && "invisible")}>
          <DuelText
            run={self.run}
            lastBurst={self.score.lastBurst}
            opponent={{
              wordIndex: opponent.run.wordIndex,
              letterIndex: opponent.run.letterIndex,
            }}
            opponentHandle={opponent.handle}
          />
        </div>
        {veil}
      </div>
      <div className="grow-[1.3]" />
      <div className="flex justify-center">
        <LeaveDuel connected={self.connected} onLeave={onLeave} />
      </div>
    </div>
  );
};
