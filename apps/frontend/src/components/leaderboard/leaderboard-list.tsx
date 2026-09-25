import { useSuspenseQuery } from "@tanstack/react-query";

import { leaderboardQueryOptions } from "@/api/leaderboard";
import { LeaderboardEmpty } from "@/components/leaderboard/leaderboard-empty";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";

// The Classement's first Users, the reader's line among them; below the list when they stand
// further down.
export const LeaderboardList = () => {
  const { data } = useSuspenseQuery(leaderboardQueryOptions);
  const { entries, me } = data;

  if (entries.length === 0 && me === null) {
    return <LeaderboardEmpty />;
  }

  const listed = me !== null && entries.some((entry) => entry.position === me.position);

  return (
    <ol className="flex flex-col gap-2" aria-label="Classement">
      {entries.map((entry) => (
        <LeaderboardRow key={entry.position} entry={entry} mine={entry.position === me?.position} />
      ))}
      {me !== null && !listed ? <LeaderboardRow entry={me} mine /> : null}
    </ol>
  );
};
