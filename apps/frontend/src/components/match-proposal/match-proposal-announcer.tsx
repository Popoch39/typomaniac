import { proposalAnnouncement } from "@/components/match-proposal/match-proposal-copy";
import { useLocale } from "@/locale/use-locale";
import type { ProposalStage, QueueLock } from "@/stores/duel-store";

// Told to screen readers: the opponent and the time to answer, with the warning when declining
// would lock the Queue, then each outcome, and the Queue lock the User's Dodge imposed.
export const MatchProposalAnnouncer = ({
  stage,
  opponent,
  dodgeLock,
  queueLock,
}: {
  stage: ProposalStage;
  opponent: string;
  dodgeLock: number | null;
  queueLock: QueueLock | null;
}) => {
  const locale = useLocale();

  return (
    <output aria-live="assertive" className="sr-only">
      {proposalAnnouncement(stage, opponent, locale, { dodgeLock, queueLock })}
    </output>
  );
};
