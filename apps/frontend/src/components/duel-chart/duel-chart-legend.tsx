import { OpponentHandle } from "@/components/handle/opponent-handle";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// What the Duel chart draws, under it: each player's wpm line in their colour, the raw dots and
// the Misses crosses. A deleted opponent has no line left.
export const DuelChartLegend = ({ opponent }: { opponent: { handle: string } | null }) => {
  const locale = useLocale();

  return (
    <figcaption className="flex flex-wrap gap-x-4.5 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-0.75 w-4 rounded-full bg-caret" />
        {m.duel_chart_legend_own_wpm({}, { locale })}
      </span>
      {opponent === null ? null : (
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.75 w-4 rounded-full bg-opponent-caret" />
          {/* The Handle and the words around it, kept on one line in the message's order. */}
          <span>
            {withSlots((marks) => m.duel_chart_legend_opponent_wpm(marks, { locale }), {
              opponent: <OpponentHandle opponent={opponent} className="text-foreground" />,
            })}
          </span>
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground" />
        {m.duel_chart_legend_raw({}, { locale })}
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="font-bold">
          ×
        </span>
        {m.duel_chart_legend_misses({}, { locale })}
      </span>
    </figcaption>
  );
};
