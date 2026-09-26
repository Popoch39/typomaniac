import { cn } from "cn";
import type { Rank } from "ranked";

import { MatchProposalChip } from "@/components/match-proposal/match-proposal-chip";
import type { PlayerStatus } from "@/components/match-proposal/match-proposal-copy";
import { MatchProposalRank } from "@/components/match-proposal/match-proposal-rank";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

type MatchProposalPlayerProps = {
  handle: string;
  image: string | null;
  rank: Rank | null;
  status: PlayerStatus;
  // This User: « (toi) » after the Handle, their avatar in the accent.
  self?: boolean;
  // Greyed out: the opponent, once the Match proposal ended without a Duel.
  faded?: boolean;
};

const RINGS: Record<PlayerStatus, string> = {
  turn: "ring-2 ring-primary",
  ready: "ring-2 ring-win",
  thinking: "",
  declined: "",
  missed: "",
  requeued: "",
};

// One of the two players of the Match proposal: avatar, Handle, rank and where they stand, their
// card ringed in the accent while it is their turn, in green once ready.
export const MatchProposalPlayer = ({
  handle,
  image,
  rank,
  status,
  self = false,
  faded = false,
}: MatchProposalPlayerProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-3 rounded-[1.375rem] bg-muted px-3 py-5 transition-[box-shadow,opacity] duration-300",
      RINGS[status],
      faded && "opacity-55",
    )}
  >
    <Avatar className="size-21 rounded-[33%] after:hidden">
      {image ? <AvatarImage src={image} alt="" /> : null}
      <AvatarFallback
        className={cn(
          "text-[2rem] font-extrabold text-primary-foreground",
          self ? "bg-primary" : "bg-opponent",
        )}
      >
        {initials(handle)}
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-col items-center gap-1">
      <span className="text-lg font-bold">
        {handle}
        {self ? <span className="font-medium text-muted-foreground"> (toi)</span> : null}
      </span>
      <MatchProposalRank rank={rank} />
    </div>
    <MatchProposalChip status={status} />
  </div>
);
