import { useRef } from "react";
import type { RunState } from "typing-engine";

import { DuelTextCaret } from "@/components/duel-hud/duel-text-caret";
import { DuelTextRow } from "@/components/duel-hud/duel-text-row";
import { isOnLines, shownLines, textLines } from "@/components/duel-hud/text-rows";
import { useBurstHighlight } from "@/components/duel-hud/use-burst-highlight";
import { useDuelCarets } from "@/components/duel-hud/use-duel-carets";
import type { CaretPosition } from "@/components/run/use-text-layout";
import { useWrongWordWave } from "@/components/run/use-wrong-word-wave";
import { handleInitials } from "@/lib/handle-initials";

type DuelTextProps = {
  run: RunState;
  // The index of the word of this User's last Burst; null when there is none.
  lastBurst: number | null;
  opponent: CaretPosition;
  opponentHandle: string;
};

// The Duel's Text as its board draws it: this User's Run on three fixed rows, the word of their
// last Burst highlighted, their Wrong words underlined with the wave, their caret and the
// opponent's, with the opponent's initials under it and hidden while their word is not on the rows
// shown.
export const DuelText = ({ run, lastBurst, opponent, opponentHandle }: DuelTextProps) => {
  const textRef = useRef<HTMLDivElement>(null);
  const rows = shownLines(textLines(run.words), run.wordIndex);
  const firstWord = rows[0]?.start ?? 0;
  const opponentShown = isOnLines(rows, opponent.wordIndex);

  const { caretRef, opponentCaretRef } = useDuelCarets(
    textRef,
    { wordIndex: run.wordIndex, letterIndex: run.letterIndex },
    opponent,
    { firstWord, opponentShown },
  );

  useBurstHighlight(textRef, lastBurst);
  useWrongWordWave(textRef, run);

  // Its size is the one `textLines` cuts the lines for.
  return (
    <div
      ref={textRef}
      className="relative flex flex-col font-text text-[42px] leading-[1.3] font-extrabold"
    >
      {rows.map((line) => (
        <DuelTextRow
          key={line.start}
          words={run.words.slice(line.start, line.end)}
          validatedWords={run.validatedWords}
          lastBurst={lastBurst}
        />
      ))}
      <DuelTextCaret ref={caretRef} tone="own" label={null} hidden={false} />
      <DuelTextCaret
        ref={opponentCaretRef}
        tone="opponent"
        label={handleInitials(opponentHandle)}
        hidden={!opponentShown}
      />
    </div>
  );
};
