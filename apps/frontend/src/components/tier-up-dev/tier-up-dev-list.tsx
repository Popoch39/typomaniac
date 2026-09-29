import { standingName } from "@/components/tier/tier";
import { DEV_TIER_UPS, type DevTierUp } from "@/components/tier-up-dev/dev-tier-ups";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";

// The six Tier-ups, each a button that plays it.
export const TierUpDevList = ({ onPlay }: { onPlay: (tierUp: DevTierUp) => void }) => {
  const locale = useLocale();

  return (
    <ul aria-label="Tier-ups" className="flex flex-wrap gap-2">
      {DEV_TIER_UPS.map((tierUp) => (
        <li key={tierUp.to.tier}>
          <Button variant="outline" onClick={() => onPlay(tierUp)}>
            {`${standingName(tierUp.from, locale)} → ${standingName(tierUp.to, locale)}`}
          </Button>
        </li>
      ))}
    </ul>
  );
};
