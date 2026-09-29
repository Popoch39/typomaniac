import type { Rank } from "ranked";

import { TierBadge } from "@/components/tier/rank/tier-badge";

// The Crest of the User's Tier, in large, with its Division; none in Placement nor without a rank.
export const RankedCardCrest = ({ rank }: { rank: Rank | null }) =>
  rank === null || "placementsLeft" in rank ? null : <TierBadge standing={rank} size="lg" />;
