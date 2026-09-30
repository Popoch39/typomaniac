import { cn } from "cn";
import { PLACEMENT_DUELS } from "ranked";

import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A Placement Duel: « 3/5 » in a dashed frame where the Blason will be, the Placements left, and
// a dash per Placement Duel, those played in the accent.
export const DuelEndPlacement = ({ played, left }: { played: number; left: number }) => {
  const locale = useLocale();
  const numbers = numberFormat(locale);

  return (
    <>
      <div
        aria-hidden="true"
        className="flex size-28 shrink-0 items-center justify-center rounded-[36px] border-2 border-dashed border-faint font-display text-[30px] font-black text-muted-foreground"
      >
        {numbers.format(played)}/{numbers.format(PLACEMENT_DUELS)}
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[26px] font-extrabold">
          {m.duel_rank_placement({ count: left, shown: numbers.format(left) }, { locale })}
        </p>
        <div aria-hidden="true" className="flex gap-2">
          {Array.from({ length: PLACEMENT_DUELS }, (_, index) => (
            <span
              key={index}
              data-placement-dash={index < played ? "played" : "ahead"}
              className={cn(
                "h-2.5 w-11 rounded-[4px]",
                index < played ? "bg-brand" : "bg-surface-2",
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
};
