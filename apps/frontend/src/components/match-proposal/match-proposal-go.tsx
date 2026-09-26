import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import { MatchProposalDialog } from "@/components/match-proposal/match-proposal-dialog";
import type { DuelOpponent } from "@/stores/duel-store";

type MatchProposalGoProps = { opponent: DuelOpponent; pairing: FaceOffPairing };

// Nothing left to do once both accepted.
const noop = () => {};

// « C'est parti ! »: the Match proposal accepted by both, over the Duel for the second before
// its Countdown, leaving the focus to the typing area.
export const MatchProposalGo = ({ opponent, pairing }: MatchProposalGoProps) => (
  <MatchProposalDialog
    modal={false}
    proposal={{
      stage: "ready",
      expiresAt: 0,
      opponent,
      selfRank: pairing.selfRank,
      opponentRank: pairing.opponentRank,
      selfAccepted: true,
      opponentAccepted: true,
    }}
    onAccept={noop}
    onSearchAgain={noop}
    onSolo={noop}
  />
);
