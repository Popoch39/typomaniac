import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { LeaderboardBoard } from "@/components/leaderboard/leaderboard-board";
import { LeaderboardHeader } from "@/components/leaderboard/leaderboard-header";
import { SignInPrompt } from "@/components/profile/sign-in-prompt";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Classement: the Users past Placement by Tier, Division then TP, the first three on the
// podium and the reader's line highlighted, with where the reader stands and the Tiers at the
// right. Only signed-in Users see it: a Visitor is invited to sign in, under its header.
export const LeaderboardPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-6">
      <LeaderboardHeader />
      {me === null ? (
        <SignInPrompt reason={m.leaderboard_sign_in_reason({}, { locale })} />
      ) : (
        <LeaderboardBoard rank={me.rank} />
      )}
    </section>
  );
};
