import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelDetailsTp } from "@/components/duel-history/duel-details-tp";
import { duelKind } from "@/components/duel-history/duel-kind";
import { DuelTime } from "@/components/duel-history/duel-time";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

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
          {withSlots(
            (marks) =>
              m.duel_details_against({ ...marks, kind: duelKind(duel.ranked, locale) }, { locale }),
            {
              opponent: (
                <OpponentHandle opponent={duel.opponent} className="font-bold text-foreground" />
              ),
              date: <DuelTime endedAt={duel.endedAt} />,
            },
          )}
        </p>
      </div>
      <DuelDetailsTp tp={duel.tp} />
    </header>
  );
};
