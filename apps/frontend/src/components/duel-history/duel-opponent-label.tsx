import { OpponentHandle } from "@/components/handle/opponent-handle";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

const endedAtFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

type DuelOpponentLabelProps = {
  // Their Handle and avatar of today, null once their User is deleted.
  opponent: { handle: string; image: string | null } | null;
  endedAt: number;
};

// Against whom and when a finished Duel was played: in the Duel history and atop its Replay.
export const DuelOpponentLabel = ({ opponent, endedAt }: DuelOpponentLabelProps) => (
  <div className="flex min-w-0 flex-1 items-center gap-3">
    {/* A deleted User has no Handle left: « ? » stands in for their initials. */}
    <UserAvatar handle={opponent?.handle ?? "?"} image={opponent?.image ?? null} size="sm" />
    <div className="flex min-w-0 flex-col">
      <OpponentHandle opponent={opponent} className="relative z-10 truncate" />
      <time
        dateTime={new Date(endedAt).toISOString()}
        className="text-[0.7rem] text-muted-foreground"
      >
        {endedAtFormat.format(endedAt)}
      </time>
    </div>
  </div>
);
