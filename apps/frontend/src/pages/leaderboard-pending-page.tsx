import { LeaderboardHeader } from "@/components/leaderboard/leaderboard-header";
import { LeaderboardSkeleton } from "@/components/leaderboard/leaderboard-skeleton";

// The Classement while it loads.
export const LeaderboardPendingPage = () => (
  <section className="flex flex-col gap-6">
    <LeaderboardHeader />
    <div className="w-full max-w-2xl">
      <LeaderboardSkeleton />
    </div>
  </section>
);
