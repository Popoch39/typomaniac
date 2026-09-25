import { LeaderboardSkeleton } from "@/components/leaderboard/leaderboard-skeleton";

// The Classement while it loads.
export const LeaderboardPendingPage = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
    <h1 className="text-2xl font-extrabold">Classement</h1>
    <LeaderboardSkeleton />
  </section>
);
