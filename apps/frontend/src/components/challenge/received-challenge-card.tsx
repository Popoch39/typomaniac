import { ChallengeCard } from "@/components/challenge/challenge-card";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { type ReceivedChallenge, sendToServer } from "@/stores/connection-store";

type ReceivedChallengeCardProps = {
  challenge: ReceivedChallenge;
};

// A Friend challenges the User: accepting plays the Duel in this tab, the click letting its
// Face-off sound.
export const ReceivedChallengeCard = ({ challenge }: ReceivedChallengeCardProps) => {
  const { unlock: unlockSounds } = useFaceOffSounds();

  const accept = () => {
    unlockSounds();
    sendToServer({ type: "accept-challenge", challengeId: challenge.id });
  };

  return (
    <ChallengeCard
      user={challenge.from}
      expiresAt={challenge.expiresAt}
      title={
        <>
          <span className="font-bold">{atHandle(challenge.from.handle)}</span> te défie en Duel
        </>
      }
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={() => sendToServer({ type: "decline-challenge", challengeId: challenge.id })}
      >
        Refuser
      </Button>
      <Button size="sm" onClick={accept}>
        Accepter
      </Button>
    </ChallengeCard>
  );
};
