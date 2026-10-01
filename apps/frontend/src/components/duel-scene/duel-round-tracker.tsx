import { DuelRoundPips } from "@/components/duel-scene/duel-round-pips";
import type { DuelRoundView } from "@/components/duel-scene/duel-round-view";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Beside the format of a Ranked Duel: « Manche 2 », then this User's pips and the opponent's,
// filled for the Rounds each won. Read out as the Round and the count.
export const DuelRoundTracker = ({ view }: { view: DuelRoundView }) => {
  const locale = useLocale();

  return (
    <p className="flex items-center gap-3 rounded-full bg-card px-3.5 py-2 text-[13px] leading-[normal] font-semibold">
      <span>{m.round_break_round_n({ n: view.number }, { locale })}</span>
      <span className="sr-only">
        {m.round_break_count(
          { self: view.roundsWon, opponent: view.opponentRoundsWon },
          { locale },
        )}
      </span>
      <DuelRoundPips pips={view.self} tone="bg-brand" />
      <DuelRoundPips pips={view.opponent} tone="bg-opponent" />
    </p>
  );
};
