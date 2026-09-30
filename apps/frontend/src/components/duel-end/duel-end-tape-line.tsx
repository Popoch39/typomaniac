import { DuelEndTapeName } from "@/components/duel-end/duel-end-tape-name";
import { DuelEndTapeValue } from "@/components/duel-end/duel-end-tape-value";
import type { TapeLine } from "@/components/duel-end/tape-lines";

// A figure of the Duel, this User's at the left, the opponent's at the right, named between them,
// ruled under (on its cells: the table's borders are separate).
export const DuelEndTapeLine = ({ line }: { line: TapeLine }) => (
  <tr className="h-[58px] *:border-b *:border-surface-2">
    <DuelEndTapeValue side="mine" value={line.mine} best={line.best} record={line.record} />
    <DuelEndTapeName>{line.label}</DuelEndTapeName>
    <DuelEndTapeValue side="theirs" value={line.theirs} best={line.best} record={false} />
  </tr>
);
