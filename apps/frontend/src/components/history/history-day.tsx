import type { DuelHistoryEntry } from "@/api/duel-history";
import { HistoryDuelCard } from "@/components/history/history-duel-card";
import { dayTallyLine, dayTitle } from "@/components/history/history-text";
import { type DayKey, tallyOf } from "@/components/history/history-week";
import { useHistoryView } from "@/components/history/use-history-view";
import { useLocale } from "@/locale/use-locale";

type HistoryDayProps = { day: DayKey; duels: DuelHistoryEntry[] };

// A day of the week shown: its name and how its Duels went, then a card for each, three a row.
export const HistoryDay = ({ day, duels }: HistoryDayProps) => {
  const { today } = useHistoryView();
  const locale = useLocale();
  const title = dayTitle(day, today, locale);

  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-baseline gap-4">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">{title}</h2>
        <span className="font-journal-mono text-[13px] text-muted-foreground">
          {dayTallyLine(tallyOf(duels), locale)}
        </span>
        <span aria-hidden className="h-px grow self-center bg-surface-2" />
      </div>
      <ol className="m-0 grid list-none grid-cols-3 gap-3 p-0">
        {duels.map((duel) => (
          <HistoryDuelCard key={duel.id} duel={duel} />
        ))}
      </ol>
    </section>
  );
};
