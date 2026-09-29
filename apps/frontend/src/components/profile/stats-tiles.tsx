import type { Stats } from "@/api/profile";
import { StatTile } from "@/components/profile/stat-tile";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A value rounded and grouped by thousands for a tile, in the Locale (« 1 612 », "1,612").
const rounded = (value: number, locale: Locale) => numberFormat(locale).format(Math.round(value));

// A tile's value, a dash when there is none (no Duel since the Score).
const shown = (value: number | null, locale: Locale) =>
  value === null ? "–" : rounded(value, locale);

// A share for a tile, in the Locale (« 97 % », "97%"), a dash when there is none.
const share = (value: number | null, locale: Locale) =>
  value === null ? "–" : m.format_percent({ value: rounded(value, locale) }, { locale });

// The User's Stats on one grid: their record (wins, losses with the Forfeits, Draws, how often they
// win), then the averages and the bests of their Duels.
export const StatsTiles = ({ stats }: { stats: Stats }) => {
  const locale = useLocale();

  return (
    <dl aria-label={m.profile_stats_title({}, { locale })} className="grid grid-cols-5 gap-2.5">
      <StatTile term={m.profile_stat_wins({}, { locale })}>
        {shown(stats.record.wins, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_losses({}, { locale })}>
        {shown(stats.record.losses, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_draws({}, { locale })}>
        {shown(stats.record.draws, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_win_rate({}, { locale })}>
        {share((stats.record.wins / stats.duels) * 100, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_duels({}, { locale })}>{shown(stats.duels, locale)}</StatTile>
      <StatTile term={m.profile_stat_average_wpm({}, { locale })}>
        {shown(stats.averages.wpm, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_best_wpm({}, { locale })}>
        {shown(stats.records.wpm, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_average_accuracy({}, { locale })}>
        {share(stats.averages.accuracy, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_best_score({}, { locale })}>
        {shown(stats.records.score, locale)}
      </StatTile>
      <StatTile term={m.profile_stat_best_combo({}, { locale })}>
        {shown(stats.records.combo, locale)}
      </StatTile>
    </dl>
  );
};
