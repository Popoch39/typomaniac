import { ChallengeCard } from "@/components/challenge/challenge-card";
import { Button } from "@/components/ui/button";
import { atHandle } from "@/lib/at-handle";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { type SentChallenge, sendToServer } from "@/stores/connection-store";

type SentChallengeCardProps = {
  challenge: SentChallenge;
};

// The User's Challenge, waiting for its answer: they can cancel it.
export const SentChallengeCard = ({ challenge }: SentChallengeCardProps) => {
  const locale = useLocale();

  return (
    <ChallengeCard
      user={challenge.to}
      expiresAt={challenge.expiresAt}
      title={withSlots((marks) => m.challenge_sent(marks, { locale }), {
        handle: <span className="font-bold">{atHandle(challenge.to.handle)}</span>,
      })}
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={() => sendToServer({ type: "cancel-challenge", challengeId: challenge.id })}
      >
        {m.challenge_cancel({}, { locale })}
      </Button>
    </ChallengeCard>
  );
};
