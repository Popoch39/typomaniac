import { cn } from "cn";
import { useId } from "react";

import type { Stats } from "@/api/profile";
import { PercentFigure } from "@/components/profile/percent-figure";
import {
  PROFILE_CARD_LABEL_PAINT,
  PROFILE_TILE_PAINT,
} from "@/components/profile/profile-card-paint";
import { WinRateBar } from "@/components/profile/win-rate-bar";
import { WinRateLegend } from "@/components/profile/win-rate-legend";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type WinRateCardProps = { record: Stats["record"]; duels: number };

// How often the User wins, on its tile: the share, large, then the wins, Draws and losses (their
// Forfeits among them) as one bar, and their counts at the foot of the tile.
export const WinRateCard = ({ record, duels }: WinRateCardProps) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex flex-col justify-between gap-3 p-6", PROFILE_TILE_PAINT)}
    >
      <h2 id={titleId} className={PROFILE_CARD_LABEL_PAINT}>
        {m.profile_stat_win_rate({}, { locale })}
      </h2>
      <div className="flex flex-col gap-3.5">
        <PercentFigure value={(record.wins / duels) * 100} />
        <WinRateBar record={record} duels={duels} />
      </div>
      <WinRateLegend record={record} />
    </section>
  );
};
