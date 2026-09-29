import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import {
  type PlayerStatus,
  playerStatusLabel,
} from "@/components/match-proposal/match-proposal-copy";
import { useLocale } from "@/locale/use-locale";

const TONES: Record<PlayerStatus, string> = {
  turn: "bg-card text-muted-foreground",
  ready: "bg-win/14 text-win",
  thinking: "bg-card text-muted-foreground",
  declined: "bg-destructive/14 text-destructive",
  missed: "bg-destructive/14 text-destructive",
  requeued: "bg-card text-muted-foreground",
};

// Under a player's name: where they stand, a check once ready, a spinner while thinking.
export const MatchProposalChip = ({ status }: { status: PlayerStatus }) => {
  const locale = useLocale();

  return (
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
      {playerStatusLabel(status, locale)}
    </span>
  );
};
