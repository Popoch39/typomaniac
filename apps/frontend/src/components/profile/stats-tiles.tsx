import type { Stats } from "@/api/profile";
import { StatTile } from "@/components/profile/stat-tile";

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

// A value rounded and grouped by thousands for a tile (« 1 612 »), a dash when there is none (no
// Duel since the Score).
const shown = (value: number | null, unit = "") =>
  value === null ? "–" : `${numberFormat.format(Math.round(value))}${unit}`;

// The User's Stats on one grid: their record (wins, losses with the Forfeits, Draws, how often they
// win), then the averages and the bests of their Duels.
export const StatsTiles = ({ stats }: { stats: Stats }) => (
  <dl aria-label="Stats" className="grid grid-cols-5 gap-2.5">
    <StatTile term="victoires">{shown(stats.record.wins)}</StatTile>
    <StatTile term="défaites">{shown(stats.record.losses)}</StatTile>
    <StatTile term="Draws">{shown(stats.record.draws)}</StatTile>
    <StatTile term="taux de victoire">
      {shown((stats.record.wins / stats.duels) * 100, " %")}
    </StatTile>
    <StatTile term="Duels">{shown(stats.duels)}</StatTile>
    <StatTile term="wpm moyen">{shown(stats.averages.wpm)}</StatTile>
    <StatTile term="meilleur wpm">{shown(stats.records.wpm)}</StatTile>
    <StatTile term="accuracy moyenne">{shown(stats.averages.accuracy, " %")}</StatTile>
    <StatTile term="meilleur Score">{shown(stats.records.score)}</StatTile>
    <StatTile term="meilleur Combo">{shown(stats.records.combo)}</StatTile>
  </dl>
);
