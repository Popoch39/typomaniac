import type { Standing } from "ranked";

import { DuelEndTpTrack } from "@/components/duel-end/duel-end-tp-track";
import type { TpBar } from "@/components/duel-end/rank-card";
import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

type DuelEndTpBarProps = { bar: TpBar; standing: Standing };

// The Division's bar on the rest of the card, and under it « 0 », « N TP avant <rang suivant> »,
// « 100 ».
export const DuelEndTpBar = ({ bar, standing }: DuelEndTpBarProps) => {
  const locale = useLocale();
  const progress = tpProgressOf(standing, locale);
  const numbers = numberFormat(locale);

  if (progress?.kind !== "division") {
    return null;
  }

  return (
    <div className="flex grow flex-col gap-2.5">
      <DuelEndTpTrack bar={bar} />
      <div className="flex justify-between font-mono text-[13px] text-muted-foreground">
        <span>{numbers.format(0)}</span>
        <span>{progress.toNext}</span>
        <span>{numbers.format(progress.of)}</span>
      </div>
    </div>
  );
};
