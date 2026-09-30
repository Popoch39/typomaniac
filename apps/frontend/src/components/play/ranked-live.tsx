import { RankedQueueNow } from "@/components/play/ranked-queue-now";
import { RecentTierDuels } from "@/components/play/recent-tier-duels";

// The Ranked card's live zone, for a User: the Queue right now, then the last Duels of their Tier,
// whose rows go first when the card is short.
export const RankedLive = () => (
  <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
    <RankedQueueNow />
    <RecentTierDuels />
  </div>
);
