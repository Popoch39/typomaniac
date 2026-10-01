import { cn } from "cn";

import { DuelEndRecordTile } from "@/components/duel-end/duel-end-record-tile";
import type { RecordTile } from "@/components/duel-end/record-tiles";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's three Records against this Duel, a tile each, side by side; in a Bo3's column
// (`compact`), one above the other, smaller.
export const DuelEndRecords = ({
  tiles,
  compact = false,
}: {
  tiles: RecordTile[];
  compact?: boolean;
}) => {
  const locale = useLocale();

  return (
    <section aria-label={m.duel_ended_records({}, { locale })}>
      <ul className={cn("grid", compact ? "grid-cols-1 gap-3" : "grid-cols-3 gap-4")}>
        {tiles.map((tile) => (
          <DuelEndRecordTile key={tile.id} tile={tile} compact={compact} />
        ))}
      </ul>
    </section>
  );
};
