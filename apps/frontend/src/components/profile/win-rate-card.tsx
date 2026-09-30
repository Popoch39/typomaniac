import { useId } from "react";

import type { Stats } from "@/api/profile";
import { PercentFigure } from "@/components/profile/percent-figure";
import { PROFILE_CARD_LABEL_PAINT } from "@/components/profile/profile-card-paint";
import { WinRateBar } from "@/components/profile/win-rate-bar";
import { WinRateLegend } from "@/components/profile/win-rate-legend";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type WinRateCardProps = { record: Stats["record"]; duels: number };

// How often the User wins, on its card: the share, large, then the wins, Draws and losses (their
// Forfeits among them) as one bar, and their counts.
export const WinRateCard = ({ record, duels }: WinRateCardProps) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4.5 rounded-card bg-card p-7">
      <h2 id={titleId} className={PROFILE_CARD_LABEL_PAINT}>
        {m.profile_stat_win_rate({}, { locale })}
      </h2>
      <PercentFigure value={(record.wins / duels) * 100} />
      <WinRateBar record={record} duels={duels} />
      <WinRateLegend record={record} />
    </section>
  );
};
