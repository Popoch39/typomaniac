import { cn } from "cn";

import type { LeaderboardEntry } from "@/api/leaderboard";
import { HandleLink } from "@/components/handle/handle-link";
import { initialsPaint, MINE_PLACE_PAINT } from "@/components/leaderboard/leaderboard-paint";
import { LeaderboardYou } from "@/components/leaderboard/leaderboard-you";
import { RankChip } from "@/components/tier/rank/rank-chip";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

type LeaderboardRowProps = { entry: LeaderboardEntry; mine: boolean };

// A User of the Classement: their place, avatar with their Ornament, Handle and rank. The reader's
// own line stands out.
export const LeaderboardRow = ({ entry, mine }: LeaderboardRowProps) => {
  const locale = useLocale();

  return (
    <li
      aria-current={mine ? "true" : undefined}
      tabIndex={mine ? -1 : undefined}
      className={cn(
        "flex h-14 items-center gap-4 rounded-[18px] px-5 outline-none",
        mine ? MINE_PLACE_PAINT : "bg-card",
      )}
    >
      <span
        className={cn(
          "w-9 text-right font-mono font-semibold tabular-nums",
          mine ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {numberFormat(locale).format(entry.place)}
      </span>
      <UserAvatar
        handle={entry.handle}
        image={entry.image}
        ornament={entry.ornament}
        className="size-9"
        fallbackClassName={cn("text-[13px] font-bold", initialsPaint(mine))}
      />
      {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
      <span className="relative flex min-w-0 flex-1 items-center gap-2 text-[15px] font-semibold">
        <HandleLink handle={entry.handle} className={cn("truncate", mine ? "font-bold" : null)} />
        {mine ? <LeaderboardYou /> : null}
      </span>
      <span className="relative">
        <RankChip rank={entry.rank} />
      </span>
    </li>
  );
};
