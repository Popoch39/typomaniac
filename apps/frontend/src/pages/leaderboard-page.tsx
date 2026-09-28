import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { LeaderboardHeader } from "@/components/leaderboard/leaderboard-header";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { SignInPrompt } from "@/components/profile/sign-in-prompt";

// The Classement: the Users past Placement by Tier, Division then TP, the reader's line
// highlighted. Only signed-in Users see it: a Visitor is invited to sign in, under its header.
export const LeaderboardPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return (
    <section className="flex flex-col gap-6">
      <LeaderboardHeader />
      <div className="w-full max-w-2xl">
        {me === null ? (
          <SignInPrompt reason="Connecte-toi pour voir le Classement." />
        ) : (
          <LeaderboardList />
        )}
      </div>
    </section>
  );
};
