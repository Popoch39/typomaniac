import { AcceptedChallengeCard } from "@/components/challenge/accepted-challenge-card";
import { ReceivedChallengeCard } from "@/components/challenge/received-challenge-card";
import { SentChallengeCard } from "@/components/challenge/sent-challenge-card";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useConnectionStore } from "@/stores/connection-store";

// The User's Challenges waiting, over every page of the app: the one they sent, to cancel, and
// those they received, to answer. Every tab shows them; each card goes once its Challenge ends,
// except the one accepted, which says « C'est parti ! » until its Duel is found.
export const WaitingChallenges = () => {
  const sent = useConnectionStore((store) => store.challenges?.sent ?? null);
  const received = useConnectionStore((store) => store.challenges?.received);
  const accepted = useConnectionStore((store) => store.challenges?.accepted ?? null);
  const locale = useLocale();

  let sentCard = null;

  if (sent !== null) {
    sentCard =
      sent.id === accepted ? (
        <AcceptedChallengeCard user={sent.to} />
      ) : (
        <SentChallengeCard challenge={sent} />
      );
  }

  return (
    <ul
      aria-label={m.challenge_list({}, { locale })}
      aria-live="polite"
      className="fixed top-16 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {sentCard}
      {received?.map((challenge) =>
        challenge.id === accepted ? (
          <AcceptedChallengeCard key={challenge.id} user={challenge.from} />
        ) : (
          <ReceivedChallengeCard key={challenge.id} challenge={challenge} />
        ),
      )}
    </ul>
  );
};
