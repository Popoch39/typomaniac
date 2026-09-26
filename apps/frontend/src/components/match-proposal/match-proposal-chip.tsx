import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import {
  PLAYER_STATUS_LABELS,
  type PlayerStatus,
} from "@/components/match-proposal/match-proposal-copy";

const TONES: Record<PlayerStatus, string> = {
  turn: "bg-card text-muted-foreground",
  ready: "bg-win/14 text-win",
  thinking: "bg-card text-muted-foreground",
  missed: "bg-destructive/14 text-destructive",
};

// Under a player's name: where they stand, a check once ready, a spinner while thinking.
export const MatchProposalChip = ({ status }: { status: PlayerStatus }) => (
  <span
    className={cn(
      "flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-semibold",
      TONES[status],
    )}
  >
    {status === "ready" ? <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} /> : null}
    {status === "thinking" ? (
      <span
        aria-hidden
        className="size-2.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
      />
    ) : null}
    {PLAYER_STATUS_LABELS[status]}
  </span>
);
