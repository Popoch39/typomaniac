import { DUEL_END_COMPACT_CARD_PAINT } from "@/components/duel-end/duel-end-paint";
import { DuelEndRoundLine } from "@/components/duel-end/duel-end-round-line";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { PlayedRound } from "@/stores/duel-store";

// The series line by line, in place of both Scores: a line per Round played, never one that was
// not.
export const DuelEndRounds = ({
  rounds,
  opponent,
}: {
  rounds: readonly PlayedRound[];
  opponent: string;
}) => {
  const locale = useLocale();

  return (
    <section
      aria-label={m.duel_ended_rounds({}, { locale })}
      data-entrance="rounds"
      className={DUEL_END_COMPACT_CARD_PAINT}
    >
      <ol className="flex flex-col gap-1.5">
        {rounds.map((round) => (
          <DuelEndRoundLine key={round.index} round={round} opponent={opponent} />
        ))}
      </ol>
    </section>
  );
};
