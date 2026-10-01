import { cn } from "cn";

import { signedTp } from "@/components/tier/rank/rank-label";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The TP a ranked Duel moved, large: « +12 TP » in the accent, « −14 TP » in grey, « ±0 TP ».
// `compact`, in a Bo3's column: smaller.
export const DuelEndTpDelta = ({ tp, compact = false }: { tp: number; compact?: boolean }) => {
  const locale = useLocale();

  return (
    <p
      data-entrance="tp"
      className={cn(
        "shrink-0 font-display font-black tracking-[-0.03em]",
        compact ? "text-[40px]" : "text-[56px]",
        tp >= 0 ? "text-brand" : "text-muted-foreground",
      )}
    >
      {tp === 0
        ? m.duel_rank_tp_even({ tp: numberFormat(locale).format(0) }, { locale })
        : signedTp(tp, locale)}
    </p>
  );
};
