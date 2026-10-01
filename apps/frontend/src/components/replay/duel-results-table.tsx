import type { ReplayedDuel } from "@/api/duel-history";
import { DuelResultLine } from "@/components/replay/duel-result-line";
import { duelResultLines } from "@/components/replay/duel-result-lines";
import { opponentName } from "@/lib/opponent-name";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Both sides of the Duel line by line, the User's first, each column in its player's
// colour. A deleted opponent leaves the User's column only.
export const DuelResultsTable = ({ duel }: { duel: ReplayedDuel }) => {
  const locale = useLocale();

  return (
    <table
      aria-label={m.duel_results_label({}, { locale })}
      className="w-full border-collapse text-sm"
    >
      <thead>
        <tr>
          <th
            scope="col"
            className="pb-2 text-left font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
          >
            {m.duel_results_result({}, { locale })}
          </th>
          <th scope="col" className="pb-2 text-right font-bold text-caret">
            {m.duel_self({}, { locale })}
          </th>
          {duel.opponent === null ? null : (
            <th scope="col" className="pb-2 text-right font-bold text-opponent-caret">
              {opponentName(duel.opponent, locale)}
            </th>
          )}
        </tr>
      </thead>
      <tbody className="font-mono tabular-nums">
        {duelResultLines(duel, locale).map((line) => (
          <DuelResultLine key={line.id} line={line} />
        ))}
      </tbody>
    </table>
  );
};
