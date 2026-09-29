import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelDetailsTp } from "@/components/duel-history/duel-details-tp";
import { duelKind } from "@/components/duel-history/duel-kind";
import { DuelTime } from "@/components/duel-history/duel-time";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { useLocale } from "@/locale/use-locale";

type DuelDetailsHeaderProps = { duel: DuelHistoryEntry; titleId: string };

// The top of the chosen Duel: how it ended as its title, against whom, when and what kind of Duel,
// then the TP it moved.
export const DuelDetailsHeader = ({ duel, titleId }: DuelDetailsHeaderProps) => {
  const locale = useLocale();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="text-[30px] leading-tight font-extrabold tracking-[-0.02em]">
          <FinishedDuelOutcome outcome={duel.outcome} forfeit={duel.forfeit} />
        </h2>
        <p className="text-sm text-muted-foreground">
          contre <OpponentHandle opponent={duel.opponent} className="font-bold text-foreground" /> ·{" "}
          <DuelTime endedAt={duel.endedAt} /> · {duelKind(duel.ranked, locale)}
        </p>
      </div>
      <DuelDetailsTp tp={duel.tp} />
    </header>
  );
};
