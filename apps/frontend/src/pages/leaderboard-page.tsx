import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { SignInInvitation } from "@/components/profile/sign-in-invitation";

// The Classement: the Users past Placement by Tier, Division then TP, the reader's line
// highlighted. Only signed-in Users see it.
export const LeaderboardPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  if (me === null) {
    return <SignInInvitation title="Classement" reason="Connecte-toi pour voir le Classement." />;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-2xl font-extrabold">Classement</h1>
      <LeaderboardList />
    </section>
  );
};
