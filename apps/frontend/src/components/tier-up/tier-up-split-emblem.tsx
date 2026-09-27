import { cn } from "cn";
import type { Tier } from "ranked";

import { TierEmblem } from "@/components/tier/tier-emblem";
import { tierUpPaint } from "@/components/tier-up/tier-up-paint";

// The halves of the Emblem, each clipped at its middle line inside the part that moves, so that
// it keeps its cut edge as it turns and blurs (the clip leaves room for the rim).
const HALVES = [
  { part: "half-left", clip: "[clip-path:inset(-20px_50%_-20px_-20px)]" },
  { part: "half-right", clip: "[clip-path:inset(-20px_-20px_-20px_50%)]" },
] as const;

type TierUpSplitEmblemProps = {
  // The Tier left, whose Emblem splits.
  tier: Tier;
  // The Tier reached, whose light runs down the crack.
  reached: Tier;
};

// The Emblem of the Tier left, where the Blason will land, as the Bronze → Argent artboard draws
// it: it comes in, a crack of light runs down its middle, then it splits in two halves falling
// apart. 240 px, so that its shield is as wide as the artboard's.
export const TierUpSplitEmblem = ({ tier, reached }: TierUpSplitEmblemProps) => {
  const paint = tierUpPaint(reached);

  return (
    <div data-tier-up="old" className="absolute top-[230px] left-[600px] size-[240px]">
      {HALVES.map(({ part, clip }) => (
        <div key={part} data-tier-up={part} className="absolute inset-0">
          <div className={cn("size-full", clip)}>
            <TierEmblem tier={tier} />
          </div>
        </div>
      ))}
      <div
        data-tier-up="crack"
        className="absolute top-5 left-[118px] h-[200px] w-1 opacity-0"
        style={{ background: paint.light, boxShadow: `0 0 16px ${paint.light}` }}
      />
    </div>
  );
};
