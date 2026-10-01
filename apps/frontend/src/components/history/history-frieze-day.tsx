import { FUTURE_DAY_PAINT, HEAT_PAINT } from "@/components/history/history-paint";
import { longDay } from "@/components/history/history-text";
import { type FriezeDay, heatLevel } from "@/components/history/history-week";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

// A day of the frieze, heated by its Duels. Under the pointer, its count and its date, the swatch
// of its heat beside them; a day still to come has nothing to say.
export const HistoryFriezeDay = ({ day, duels, future }: FriezeDay) => {
  const locale = useLocale();

  if (future) {
    return <span className={cn("size-3.5 rounded-[4px]", FUTURE_DAY_PAINT)} />;
  }

  const heat = HEAT_PAINT[heatLevel(duels)];

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("size-3.5 rounded-[4px]", heat)} />} />
      <TooltipContent side="top" sideOffset={8} className="gap-2.5 px-3 py-2 font-journal">
        <span
          aria-hidden
          className={cn("size-3 shrink-0 rounded-[3px] ring-1 ring-background/30", heat)}
        />
        <span className="flex flex-col gap-0.5">
          <span className="font-journal-mono text-[13px] font-medium">
            {duels === 0
              ? m.history_frieze_day_none({}, { locale })
              : m.history_day_duels(
                  { count: duels, shown: numberFormat(locale).format(duels) },
                  { locale },
                )}
          </span>
          <span className="text-[11px] font-normal opacity-70">{longDay(day, locale)}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
};
