import { cn } from "cn";

import { RoundBreakCardBack } from "@/components/round-break/round-break-card-back";
import { RoundBreakCardFront } from "@/components/round-break/round-break-card-front";
import { RoundBreakCountdown } from "@/components/round-break/round-break-countdown";
import type { RoundCard } from "@/components/round-break/round-break-view";

// A Round's card in the Round break, 280 × 380 as on the board: its slot rises, the card in it
// lifts (`lift`) and turns (`turn`) between its faces. Marked with its state (`data-rb`), which
// the timeline reads: the one just played turns, the next one lifts, lights up (`glow`) and
// carries the 3-2-1, a later one stays dim; one played before is shown turned.
export const RoundBreakCard = ({
  card,
  opponentHandle,
}: {
  card: RoundCard;
  opponentHandle: string;
}) => (
  <div data-rb={`slot-${card.index}`} className="h-[380px] w-[280px]">
    <div data-rb={card.state} className="size-full">
      <div
        data-rb="lift"
        className={cn("relative size-full", card.state === "later" && "opacity-40")}
      >
        <div
          data-rb="turn"
          className={cn("relative size-full transform-3d", card.state === "done" && "rotate-y-180")}
        >
          <RoundBreakCardFront card={card} />
          {card.played === null ? null : (
            <RoundBreakCardBack
              index={card.index}
              played={card.played}
              opponentHandle={opponentHandle}
            />
          )}
        </div>
        {card.state === "next" ? (
          <>
            <div
              data-rb="glow"
              className="pointer-events-none absolute inset-0 rounded-card border-2 border-brand opacity-0 shadow-[0_30px_90px_-30px_var(--brand)]"
            />
            <RoundBreakCountdown />
          </>
        ) : null}
      </div>
    </div>
  </div>
);
