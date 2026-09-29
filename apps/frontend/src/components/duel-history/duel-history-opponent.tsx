import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelTime } from "@/components/duel-history/duel-time";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type DuelHistoryOpponentProps = Pick<DuelHistoryEntry, "opponent" | "endedAt" | "forfeit">;

// Against whom and when a Duel of the Duel history was played, and whether it ended by Forfeit. The
// Handle is drawn above the row's button, which stretches under it: a link never goes in a button.
export const DuelHistoryOpponent = ({ opponent, endedAt, forfeit }: DuelHistoryOpponentProps) => (
  <div className="flex min-w-0 flex-1 items-center gap-3.5">
    {/* A deleted User has no Handle left: « ? » stands in for their initials. */}
    <UserAvatar
      handle={opponent?.handle ?? "?"}
      image={opponent?.image ?? null}
      className="size-9.5"
      fallbackClassName="bg-surface-2 text-[13px] font-bold text-foreground"
    />
    <div className="flex min-w-0 flex-col gap-0.75">
      <OpponentHandle
        opponent={opponent}
        className="relative z-10 truncate text-[15px] font-semibold"
      />
      <span className="text-xs text-muted-foreground">
        <DuelTime endedAt={endedAt} />
        {forfeit ? " · Forfeit" : null}
      </span>
    </div>
  </div>
);
