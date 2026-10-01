import { useRef } from "react";

import { LeaveDuel } from "@/components/duel/leave-duel";
import { RoundBreakCaption } from "@/components/round-break/round-break-caption";
import { RoundBreakCard } from "@/components/round-break/round-break-card";
import { RoundBreakHead } from "@/components/round-break/round-break-head";
import { roundBreakView } from "@/components/round-break/round-break-view";
import { useRoundBreakTimeline } from "@/components/round-break/use-round-break-timeline";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelPlay, NextRound } from "@/stores/duel-store";

// What the Round break shows of the Duel: its Rounds and counts, both players, the connection.
export type RoundBreakDuel = Pick<
  DuelPlay,
  | "rounds"
  | "roundsWon"
  | "opponentRoundsWon"
  | "roundsToWin"
  | "selfOrnament"
  | "opponent"
  | "connected"
>;

type RoundBreakProps = {
  duel: RoundBreakDuel;
  next: NextRound;
  onLeave: () => void;
};

// Between two Rounds of a Bo3, the board B · Tableau de série on the Duel's scene: the header (both
// avatars, the count of the Rounds), the three cards of the Rounds, the caption, played on the
// Duel's clock so that the GO lands on the next Round's start. Quitter le Duel stays at its place.
export const RoundBreak = ({ duel, next, onLeave }: RoundBreakProps) => {
  const ref = useRef<HTMLElement>(null);
  const locale = useLocale();
  const view = roundBreakView(duel, next);

  useRoundBreakTimeline(ref, next.startsAt);

  return (
    <div className="flex flex-1 flex-col">
      <section
        ref={ref}
        aria-label={m.round_break_label({}, { locale })}
        className="flex flex-col items-center pt-11"
      >
        <RoundBreakHead duel={duel} count={view.count} />
        <div className="mt-11 flex gap-10 perspective-[1400px]">
          {view.cards.map((card) => (
            <RoundBreakCard key={card.index} card={card} opponentHandle={duel.opponent.handle} />
          ))}
        </div>
        <div className="mt-[52px]">
          <RoundBreakCaption nextNumber={view.nextNumber} deciding={view.deciding} />
        </div>
      </section>
      <div className="grow" />
      <div className="flex justify-center">
        <LeaveDuel connected={duel.connected} onLeave={onLeave} />
      </div>
    </div>
  );
};
