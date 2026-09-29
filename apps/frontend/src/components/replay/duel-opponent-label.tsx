import type { ReplayedDuel } from "@/api/duel-history";
import { DuelTime } from "@/components/duel-history/duel-time";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type DuelOpponentLabelProps = { opponent: ReplayedDuel["opponent"]; endedAt: number };

// Against whom and when a finished Duel was played, atop its Replay.
export const DuelOpponentLabel = ({ opponent, endedAt }: DuelOpponentLabelProps) => (
  <div className="flex min-w-0 flex-1 items-center gap-3">
    {/* A deleted User has no Handle left: « ? » stands in for their initials. */}
    <UserAvatar handle={opponent?.handle ?? "?"} image={opponent?.image ?? null} size="sm" />
    <div className="flex min-w-0 flex-col">
      <OpponentHandle opponent={opponent} className="relative z-10 truncate" />
      <span className="text-[0.7rem] text-muted-foreground">
        <DuelTime endedAt={endedAt} />
      </span>
    </div>
  </div>
);
