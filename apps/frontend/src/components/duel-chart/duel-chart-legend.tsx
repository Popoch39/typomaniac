import { OpponentHandle } from "@/components/handle/opponent-handle";

// What the Duel chart draws, under it: each player's wpm line in their colour, the raw dots and
// the Misses crosses. A deleted opponent has no line left.
export const DuelChartLegend = ({ opponent }: { opponent: { handle: string } | null }) => (
  <figcaption className="flex flex-wrap gap-x-4.5 gap-y-2 text-xs text-muted-foreground">
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="h-0.75 w-4 rounded-full bg-caret" />
      ton wpm
    </span>
    {opponent === null ? null : (
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-0.75 w-4 rounded-full bg-opponent-caret" />
        wpm de <OpponentHandle opponent={opponent} className="text-foreground" />
      </span>
    )}
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground" />
      raw de chaque seconde
    </span>
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="font-bold">
        ×
      </span>
      Misses
    </span>
  </figcaption>
);
