import { isPlacement, type Rank } from "ranked";

import { TierBadge } from "@/components/tier/rank/tier-badge";

// Beside a rank in words, on a Profile or in the hero of `/profile`: its badge in its Blason once
// past Placement. Hidden, the rank being written next to it: its name would be read twice.
export const ProfileRankBlason = ({ rank }: { rank: Rank }) =>
  isPlacement(rank) ? null : (
    <span aria-hidden>
      <TierBadge standing={rank} size="lg" />
    </span>
  );
