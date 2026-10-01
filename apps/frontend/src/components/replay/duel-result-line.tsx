import type { DuelResultLine as Line } from "@/components/replay/duel-result-lines";

// One line of the Results table: what it measures, then each side's value, the User's in bold.
export const DuelResultLine = ({ line }: { line: Line }) => (
  <tr className="h-8.5 border-t border-border">
    <th scope="row" className="text-left font-sans font-medium text-muted-foreground">
      {line.name}
    </th>
    <td className="text-right font-semibold">{line.own}</td>
    {line.opponent === null ? null : <td className="text-right">{line.opponent}</td>}
  </tr>
);
