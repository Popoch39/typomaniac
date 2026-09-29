import type { ReplayedDuel } from "@/api/duel-history";
import { DuelDetailsTp } from "@/components/duel-history/duel-details-tp";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { ReplayDuelFormat } from "@/components/replay/replay-duel-format";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Atop the Replay: against whom, when and what kind of Duel it was, how it ended for the User and
// the TP it moved.
export const ReplayHeader = ({ duel }: { duel: ReplayedDuel }) => {
  const locale = useLocale();

  return (
    <header className="flex items-center gap-4 rounded-card bg-card px-6 py-5">
      {/* A deleted User has no Handle left: « ? » stands in for their initials. */}
      <UserAvatar
        handle={duel.opponent?.handle ?? "?"}
        image={duel.opponent?.image ?? null}
        className="size-12"
        fallbackClassName="bg-surface-2 text-[15px] font-bold text-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <h1 className="truncate text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
          {withSlots((marks) => m.replay_title(marks, { locale }), {
            opponent: <OpponentHandle opponent={duel.opponent} />,
          })}
        </h1>
        <ReplayDuelFormat duel={duel} />
      </div>
      <FinishedDuelOutcome
        outcome={duel.outcome}
        forfeit={duel.forfeit}
        className="text-[22px] font-extrabold"
      />
      <DuelDetailsTp tp={duel.tp} />
    </header>
  );
};
