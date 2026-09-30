import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import {
  isCancelled,
  opponentStatus,
  selfStatus,
} from "@/components/match-proposal/match-proposal-copy";
import { MatchProposalPlayer } from "@/components/match-proposal/match-proposal-player";
import { MatchProposalRing } from "@/components/match-proposal/match-proposal-ring";
import { useSecondsLeft } from "@/components/match-proposal/use-seconds-left";
import type { ProposalView } from "@/stores/duel-store";

// Both players of the Match proposal, the time left to answer between them. Once it ends without
// a Duel, the opponent's card fades: out of the Queue, or back in it while the User is out. The
// User's avatar and Handle never hold it up.
export const MatchProposalPlayers = ({ proposal }: { proposal: ProposalView }) => {
  const { data: me } = useQuery(meQueryOptions);
  const left = useSecondsLeft(proposal.expiresAt);
  const { stage, opponent } = proposal;

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
      <MatchProposalPlayer
        self
        handle={me?.handle ?? ""}
        image={me?.image ?? null}
        ornament={proposal.selfOrnament}
        rank={proposal.selfRank}
        status={selfStatus(stage, proposal.selfAccepted)}
      />
      <MatchProposalRing stage={stage} secondsLeft={left} />
      <MatchProposalPlayer
        handle={opponent.handle}
        image={opponent.image}
        ornament={opponent.ornament}
        rank={proposal.opponentRank}
        status={opponentStatus(stage, proposal.opponentAccepted)}
        faded={isCancelled(stage)}
      />
    </div>
  );
};
