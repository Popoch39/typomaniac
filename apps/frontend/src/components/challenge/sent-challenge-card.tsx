import { ChallengeCard } from "@/components/challenge/challenge-card";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { type SentChallenge, sendToServer } from "@/stores/connection-store";

type SentChallengeCardProps = {
  challenge: SentChallenge;
};

// The User's Challenge, waiting for its answer: they can cancel it.
export const SentChallengeCard = ({ challenge }: SentChallengeCardProps) => (
  <ChallengeCard
    user={challenge.to}
    expiresAt={challenge.expiresAt}
    title={
      <>
        Challenge envoyé à <span className="font-bold">{atHandle(challenge.to.handle)}</span>
      </>
    }
  >
    <Button
      size="sm"
      variant="ghost"
      onClick={() => sendToServer({ type: "cancel-challenge", challengeId: challenge.id })}
    >
      Annuler
    </Button>
  </ChallengeCard>
);
