import type { ReplayedDuel } from "@/api/duel-history";
import { duelResultLines } from "@/components/duel-history/duel-result-lines";
import { DuelResultLine } from "@/components/duel-history/duel-result-line";
import { opponentName } from "@/lib/opponent-name";

// Both sides of the chosen Duel line by line, the User's first, each column in its player's
// colour. A deleted opponent leaves the User's column only.
export const DuelResultsTable = ({ duel }: { duel: ReplayedDuel }) => (
  <table aria-label="Results du Duel" className="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th
          scope="col"
          className="pb-2 text-left font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
        >
          Result
        </th>
        <th scope="col" className="pb-2 text-right font-bold text-caret">
          Toi
        </th>
        {duel.opponent === null ? null : (
          <th scope="col" className="pb-2 text-right font-bold text-opponent-caret">
            {opponentName(duel.opponent)}
          </th>
        )}
      </tr>
    </thead>
    <tbody className="font-mono tabular-nums">
      {duelResultLines(duel).map((line) => (
        <DuelResultLine key={line.name} line={line} />
      ))}
    </tbody>
  </table>
);
