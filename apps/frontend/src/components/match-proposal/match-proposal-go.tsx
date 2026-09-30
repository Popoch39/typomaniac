import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import { MatchProposalCard } from "@/components/match-proposal/match-proposal-card";
import type { DuelOpponent } from "@/stores/duel-store";

type MatchProposalGoProps = { opponent: DuelOpponent; pairing: FaceOffPairing };

// Nothing left to do once both accepted.
const noop = () => {};

// « C'est parti ! »: the Match proposal accepted by both, in the search's card over the Duel for
// the second before its Countdown. Neither modal nor clickable: the focus stays with the typing
// area, which needs it at GO.
export const MatchProposalGo = ({ opponent, pairing }: MatchProposalGoProps) => (
  <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center max-lg:hidden">
    <MatchProposalCard
      proposal={{
        stage: "ready",
        expiresAt: 0,
        opponent,
        selfOrnament: pairing.selfOrnament,
        selfRank: pairing.selfRank,
        opponentRank: pairing.opponentRank,
        selfAccepted: true,
        opponentAccepted: true,
        dodgeLock: null,
        queueLock: null,
      }}
      onAccept={noop}
      onDecline={noop}
      onSearchAgain={noop}
      onSolo={noop}
    />
  </div>
);
