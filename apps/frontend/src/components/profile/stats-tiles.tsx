import type { Stats } from "@/api/profile";
import { StatTile } from "@/components/profile/stat-tile";

// A value rounded for a tile, a dash when there is none (no Duel since the Score).
const shown = (value: number | null, unit = "") =>
  value === null ? "–" : `${Math.round(value)}${unit}`;

// The averages and the bests of the User's Duels.
export const StatsTiles = ({ stats }: { stats: Stats }) => (
  <dl aria-label="Stats" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    <StatTile term="Duels">{stats.duels}</StatTile>
    <StatTile term="wpm moyen">{shown(stats.averages.wpm)}</StatTile>
    <StatTile term="meilleur wpm">{shown(stats.records.wpm)}</StatTile>
    <StatTile term="accuracy moyenne">{shown(stats.averages.accuracy, " %")}</StatTile>
    <StatTile term="meilleur Score">{shown(stats.records.score)}</StatTile>
    <StatTile term="meilleur Combo">{shown(stats.records.combo)}</StatTile>
  </dl>
);
