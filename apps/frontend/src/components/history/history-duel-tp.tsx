import { duelKind } from "@/components/duel-history/duel-kind";
import { signedTp } from "@/components/tier/rank/rank-label";
import { useLocale } from "@/locale/use-locale";
import { cn } from "cn";

type HistoryDuelTpProps = { tp: number | null; ranked: boolean };

const PILL_PAINT = "rounded-full px-2.5 py-1 font-journal-mono text-[13px] font-medium";

// At the top right of a card: the TP the Duel moved for the User, a gain in the accent, or
// « Challenge » when it was not Ranked. Nothing for a Duel in Placement, which moved no TP.
export const HistoryDuelTp = ({ tp, ranked }: HistoryDuelTpProps) => {
  const locale = useLocale();

  if (tp !== null) {
    return (
      <span
        className={cn(
          PILL_PAINT,
          tp > 0 ? "bg-primary/16 text-primary" : "bg-surface-2 text-muted-foreground",
        )}
      >
        {signedTp(tp, locale)}
      </span>
    );
  }

  return ranked ? null : (
    <span className={cn(PILL_PAINT, "bg-surface-2 text-muted-foreground")}>
      {duelKind(false, locale)}
    </span>
  );
};
