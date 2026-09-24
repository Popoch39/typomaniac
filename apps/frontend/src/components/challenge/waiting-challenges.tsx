import { ReceivedChallengeCard } from "@/components/challenge/received-challenge-card";
import { SentChallengeCard } from "@/components/challenge/sent-challenge-card";
import { useConnectionStore } from "@/stores/connection-store";

// The User's Challenges waiting, over every page of the app: the one they sent, to cancel, and
// those they received, to answer. Every tab shows them; each card goes once its Challenge ends.
export const WaitingChallenges = () => {
  const sent = useConnectionStore((store) => store.challenges?.sent ?? null);
  const received = useConnectionStore((store) => store.challenges?.received);

  return (
    <ul
      aria-label="Challenges"
      aria-live="polite"
      className="fixed top-16 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {sent === null ? null : <SentChallengeCard challenge={sent} />}
      {received?.map((challenge) => (
        <ReceivedChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </ul>
  );
};
