import { cn } from "cn";
import { PLACEMENT_DUELS } from "ranked";

import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A Placement Duel: « 3/5 » in a dashed frame where the Blason will be, the Placements left, and
// a dash per Placement Duel, those played in the accent.
// `compact`, in a Bo3's column: smaller.
export const DuelEndPlacement = ({
  played,
  left,
  compact = false,
}: {
  played: number;
  left: number;
  compact?: boolean;
}) => {
  const locale = useLocale();
  const numbers = numberFormat(locale);

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center border-2 border-dashed border-faint font-display font-black text-muted-foreground",
          compact ? "size-16 rounded-[22px] text-lg" : "size-28 rounded-[36px] text-[30px]",
        )}
      >
        {numbers.format(played)}/{numbers.format(PLACEMENT_DUELS)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className={cn("font-extrabold", compact ? "text-lg" : "text-[26px]")}>
          {m.duel_rank_placement({ count: left, shown: numbers.format(left) }, { locale })}
        </p>
        <div aria-hidden="true" className="flex gap-2">
          {Array.from({ length: PLACEMENT_DUELS }, (_, index) => (
            <span
              key={index}
              data-placement-dash={index < played ? "played" : "ahead"}
              className={cn(
                "h-2.5 rounded-[4px]",
                compact ? "max-w-11 flex-1" : "w-11",
                index < played ? "bg-brand" : "bg-surface-2",
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
};
