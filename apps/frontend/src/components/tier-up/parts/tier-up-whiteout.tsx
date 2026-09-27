import type { Tier } from "ranked";

import { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

// The whole stage going white from the Blason's centre as it materializes, unseen until then.
export const TierUpWhiteout = ({ tier }: { tier: Tier }) => (
  <div
    data-tier-up="whiteout"
    className="absolute inset-0 opacity-0"
    style={{ background: tierUpPaint(tier).whiteout }}
  />
);
