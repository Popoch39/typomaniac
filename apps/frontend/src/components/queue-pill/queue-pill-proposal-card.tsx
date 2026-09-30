import { useId } from "react";

import type { MatchProposalHandlers } from "@/components/match-proposal/match-proposal-actions";
import { proposalHeadline } from "@/components/match-proposal/match-proposal-copy";
import { QueuePillCountdown } from "@/components/queue-pill/queue-pill-countdown";
import { QueuePillProposalActions } from "@/components/queue-pill/queue-pill-proposal-actions";
import { SearchAccent } from "@/components/search-morph/search-accent";
import { rankLabel } from "@/components/tier/rank/rank-label";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { useLocale } from "@/locale/use-locale";
import type { ProposalView } from "@/stores/duel-store";

type QueuePillProposalCardProps = MatchProposalHandlers & { proposal: ProposalView };

// The Queue pill carrying the Match proposal, in the accent, bottom right and as wide as the
// search it folds, so it never covers the Text of a Run: the opponent, their rank and the time
// left, then the answers; once answered, what the stage says under them. The accent fades in over
// the pill's surface.
export const QueuePillProposalCard = ({ proposal, ...handlers }: QueuePillProposalCardProps) => {
  const locale = useLocale();
  const titleId = useId();
  const { stage, opponent, opponentRank, queueLock } = proposal;
  const headline = proposalHeadline(stage, opponent.handle, locale, queueLock);

  return (
    <section
      aria-labelledby={titleId}
      className="fixed right-6 bottom-6 z-40 flex w-98 flex-col gap-3 py-4 pr-4 pl-5 text-primary-foreground"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[30px] bg-surface-2 shadow-[0_22px_56px_rgb(0_0_0/0.6)]"
      />
      <SearchAccent className="rounded-[30px] bg-primary" />
      <div className="flex items-center gap-3">
        <UserAvatar
          handle={opponent.handle}
          image={opponent.image}
          ornament={null}
          className="size-12 rounded-[33%] after:hidden"
          fallbackClassName="bg-opponent text-lg font-extrabold text-on-opponent"
        />
        <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
          <h2 id={titleId} className="truncate text-[15px] font-extrabold">
            {headline.title}
          </h2>
          <p className="truncate text-[13px] text-primary-foreground/72">
            <span className="font-bold text-primary-foreground">{opponent.handle}</span>
            {opponentRank === null ? null : ` · ${rankLabel(opponentRank, locale)}`}
          </p>
        </div>
        {stage === "pending" ? <QueuePillCountdown expiresAt={proposal.expiresAt} /> : null}
      </div>
      {stage === "pending" ? null : (
        <p className="text-[13px] leading-snug text-primary-foreground/72">{headline.subtitle}</p>
      )}
      <QueuePillProposalActions proposal={proposal} {...handlers} />
    </section>
  );
};
