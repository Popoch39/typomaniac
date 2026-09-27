import { standingName } from "@/components/tier/tier";
import { DEV_TIER_UPS, type DevTierUp } from "@/components/tier-up-dev/dev-tier-ups";
import { Button } from "@/components/ui/button";

// The six Tier-ups, each a button that plays it.
export const TierUpDevList = ({ onPlay }: { onPlay: (tierUp: DevTierUp) => void }) => (
  <ul aria-label="Tier-ups" className="flex flex-wrap gap-2">
    {DEV_TIER_UPS.map((tierUp) => (
      <li key={tierUp.to.tier}>
        <Button variant="outline" onClick={() => onPlay(tierUp)}>
          {`${standingName(tierUp.from)} → ${standingName(tierUp.to)}`}
        </Button>
      </li>
    ))}
  </ul>
);
