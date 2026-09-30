import { DuelEndTapeChars } from "@/components/duel-end/duel-end-tape-chars";
import { DuelEndTapeHeader } from "@/components/duel-end/duel-end-tape-header";
import { DuelEndTapeLine } from "@/components/duel-end/duel-end-tape-line";
import { DUEL_END_CARD_PAINT } from "@/components/duel-end/duel-end-paint";
import type { RecordId } from "@/components/duel-end/record-tiles";
import { tapeLines } from "@/components/duel-end/tape-lines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";

type DuelEndTapeProps = {
  ending: DuelEnding;
  opponent: string;
  // The Records the Duel beat: the wpm's and the Combo's tag their lines.
  beaten: ReadonlySet<RecordId>;
};

// The tale of the tape: each figure of the Duel, line by line, this User against the opponent,
// then their characters. The columns are named for screen readers only; the rows stand 6 px
// apart, as the board's, the edges' spacing taken back by the margins (the header row's too).
export const DuelEndTape = ({ ending, opponent, beaten }: DuelEndTapeProps) => {
  const locale = useLocale();
  const title = m.duel_ended_tape({}, { locale });

  const lines = tapeLines(
    { result: ending.result, score: ending.score },
    { result: ending.opponentResult, score: ending.opponentScore },
    beaten,
    locale,
  );

  return (
    <section aria-label={title} className={DUEL_END_CARD_PAINT}>
      <table className="-mt-3 -mb-1.5 w-full table-fixed border-separate border-spacing-x-0 border-spacing-y-1.5">
        <colgroup>
          <col />
          <col className="w-[220px]" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <DuelEndTapeHeader>{m.duel_self({}, { locale })}</DuelEndTapeHeader>
            <DuelEndTapeHeader>{title}</DuelEndTapeHeader>
            <DuelEndTapeHeader>{opponent}</DuelEndTapeHeader>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <DuelEndTapeLine key={line.id} line={line} />
          ))}
          <DuelEndTapeChars mine={ending.result.chars} theirs={ending.opponentResult.chars} />
        </tbody>
      </table>
    </section>
  );
};
