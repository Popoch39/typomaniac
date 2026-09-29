import { cn } from "cn";
import { Crown } from "lucide-react";

import type { LeaderboardEntry } from "@/api/leaderboard";
import { HandleLink } from "@/components/handle/handle-link";
import { initialsPaint, MINE_PLACE_PAINT } from "@/components/leaderboard/leaderboard-paint";
import { LeaderboardYou } from "@/components/leaderboard/leaderboard-you";
import { RankChip } from "@/components/tier/rank/rank-chip";
import { TIER_COLORS } from "@/components/tier/tier";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type LeaderboardPodiumPlaceProps = {
  entry: LeaderboardEntry;
  mine: boolean;
  // The first stands out: crowned, higher, with a larger avatar.
  first: boolean;
  // Where the card stands on the podium: the second at the left, the first in the middle.
  className: string;
};

// One of the first three of the Classement, on its card: their place, avatar with their Ornament,
// Handle and rank. Everything next to the avatar is positioned, drawn over the Ornament's overflow.
export const LeaderboardPodiumPlace = ({
  entry,
  mine,
  first,
  className,
}: LeaderboardPodiumPlaceProps) => (
  <li
    aria-current={mine ? "true" : undefined}
    className={cn(
      "row-start-1 flex flex-col items-center gap-3 rounded-card px-4 pb-5",
      first ? "pt-7" : "pt-5.5",
      mine ? MINE_PLACE_PAINT : "bg-card",
      className,
    )}
  >
    {first ? (
      <Crown
        aria-hidden
        className={cn("relative size-6.5 fill-current", TIER_COLORS[entry.rank.tier])}
      />
    ) : null}
    <span
      className={cn(
        "relative font-mono font-semibold tabular-nums",
        first ? "text-[22px] text-primary" : "text-xl text-muted-foreground",
      )}
    >
      {entry.position}
    </span>
    <UserAvatar
      handle={entry.handle}
      image={entry.image}
      ornament={entry.ornament}
      // Its Ornament, twice its size, overflows it by half on each side: the margins, with the gap,
      // keep that overflow clear of the place and the Handle.
      className={first ? "my-6.5 size-19" : "my-5 size-16"}
      fallbackClassName={cn(
        "font-extrabold",
        first ? "text-[22px]" : "text-[19px]",
        initialsPaint(mine),
      )}
    />
    <span
      className={cn(
        "relative flex max-w-full items-center gap-2 font-bold",
        first ? "text-[17px]" : "text-base",
      )}
    >
      <HandleLink handle={entry.handle} className="truncate" />
      {mine ? <LeaderboardYou /> : null}
    </span>
    <span className="relative">
      <RankChip rank={entry.rank} />
    </span>
  </li>
);
