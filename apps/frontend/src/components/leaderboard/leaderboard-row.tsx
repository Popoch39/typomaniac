import { cn } from "cn";

import type { LeaderboardEntry } from "@/api/leaderboard";
import { HandleLink } from "@/components/handle/handle-link";
import { RankChip } from "@/components/tier/rank-chip";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type LeaderboardRowProps = { entry: LeaderboardEntry; mine: boolean };

// A User of the Classement: their place, avatar, Handle and rank. The reader's own line stands out.
export const LeaderboardRow = ({ entry, mine }: LeaderboardRowProps) => (
  <li
    aria-current={mine ? "true" : undefined}
    className={cn(
      "flex items-center gap-4 rounded-2xl px-5 py-3",
      mine ? "bg-primary/15 ring-1 ring-primary" : "bg-card",
    )}
  >
    <span className="w-10 text-right font-mono text-lg font-bold tabular-nums">
      {entry.position}
    </span>
    <UserAvatar
      handle={entry.handle}
      image={entry.image}
      className="size-9"
      fallbackClassName="bg-primary text-sm font-bold text-primary-foreground"
    />
    <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
      <HandleLink handle={entry.handle} className="truncate" />
      {mine ? <span className="text-xs text-primary">Toi</span> : null}
    </span>
    <RankChip rank={entry.rank} />
  </li>
);
