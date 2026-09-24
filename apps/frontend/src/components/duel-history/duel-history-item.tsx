import type { DuelHistoryEntry } from "@/api/duel-history";
import { outcomeHeadlines } from "@/components/duel/outcome-headlines";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import { initials } from "@/lib/initials";
import { cn } from "cn";

const endedAtFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

// A Score or a wpm that is not there: a Duel before the Score, a deleted opponent.
const orDash = (value: number | null) => (value === null ? "—" : String(Math.round(value)));

// One Duel of the Duel history, from the User's side: when, against whom, how it ended, both Scores
// and both wpm (theirs first).
export const DuelHistoryItem = ({ duel }: { duel: DuelHistoryEntry }) => (
  <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar size="sm">
        {duel.opponent?.image ? <AvatarImage src={duel.opponent.image} alt="" /> : null}
        <AvatarFallback>{duel.opponent ? initials(duel.opponent.handle) : "?"}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className={cn("truncate", duel.opponent === null && "text-muted-foreground")}>
          {duel.opponent ? atHandle(duel.opponent.handle) : "User supprimé"}
        </span>
        <time
          dateTime={new Date(duel.endedAt).toISOString()}
          className="text-[0.7rem] text-muted-foreground"
        >
          {endedAtFormat.format(duel.endedAt)}
        </time>
      </div>
    </div>
    <span className={cn("font-bold", duel.outcome === "win" && "text-primary")}>
      {outcomeHeadlines[duel.outcome]}
      {duel.forfeit ? " par Forfeit" : null}
    </span>
    <span className="tabular-nums">
      <span className="text-[0.7rem] text-muted-foreground">Score </span>
      {orDash(duel.score)} – {orDash(duel.opponentScore)}
    </span>
    <span className="text-muted-foreground tabular-nums">
      {orDash(duel.wpm)} – {orDash(duel.opponentWpm)} wpm
    </span>
  </li>
);
