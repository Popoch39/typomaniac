import { standingName } from "@/components/tier/tier";
import { type TierUpRise, TIER_UP_RISES } from "@/components/tier-up-dev/tier-up-rises";
import { Button } from "@/components/ui/button";

// The six Tier-ups, each a button that plays it.
export const TierUpDevRises = ({ onPlay }: { onPlay: (rise: TierUpRise) => void }) => (
  <ul aria-label="Montées" className="flex flex-wrap gap-2">
    {TIER_UP_RISES.map((rise) => (
      <li key={rise.to.tier}>
        <Button variant="outline" onClick={() => onPlay(rise)}>
          {`${standingName(rise.from)} → ${standingName(rise.to)}`}
        </Button>
      </li>
    ))}
  </ul>
);
