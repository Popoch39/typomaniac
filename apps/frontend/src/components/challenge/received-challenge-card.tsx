import { ChallengeCard } from "@/components/challenge/challenge-card";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { type ReceivedChallenge, sendToServer } from "@/stores/connection-store";

type ReceivedChallengeCardProps = {
  challenge: ReceivedChallenge;
};

// A Friend challenges the User: accepting plays the Duel in this tab, the click letting its
// Face-off sound.
export const ReceivedChallengeCard = ({ challenge }: ReceivedChallengeCardProps) => {
  const { unlock: unlockSounds } = useFaceOffSounds();
  const locale = useLocale();

  const accept = () => {
    unlockSounds();
    sendToServer({ type: "accept-challenge", challengeId: challenge.id });
  };

  return (
    <ChallengeCard
      user={challenge.from}
      expiresAt={challenge.expiresAt}
      title={withSlots((marks) => m.challenge_received(marks, { locale }), {
        handle: <span className="font-bold">{atHandle(challenge.from.handle)}</span>,
      })}
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={() => sendToServer({ type: "decline-challenge", challengeId: challenge.id })}
      >
        {m.challenge_decline({}, { locale })}
      </Button>
      <Button size="sm" onClick={accept}>
        {m.challenge_accept({}, { locale })}
      </Button>
    </ChallengeCard>
  );
};
