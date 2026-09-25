import type { Stats } from "@/api/profile";
import { StatTile } from "@/components/profile/stat-tile";

// The User's record: their wins, losses (Forfeits included) and Draws, and how often they win.
export const StatsRecord = ({ stats }: { stats: Stats }) => (
  <dl aria-label="Bilan" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    <StatTile term="victoires">{stats.record.wins}</StatTile>
    <StatTile term="défaites">{stats.record.losses}</StatTile>
    <StatTile term="Draws">{stats.record.draws}</StatTile>
    <StatTile term="taux de victoire">
      {Math.round((stats.record.wins / stats.duels) * 100)} %
    </StatTile>
  </dl>
);
