import { DuelEndRecordTile } from "@/components/duel-end/duel-end-record-tile";
import type { RecordTile } from "@/components/duel-end/record-tiles";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's three Records against this Duel, a tile each, side by side.
export const DuelEndRecords = ({ tiles }: { tiles: RecordTile[] }) => {
  const locale = useLocale();

  return (
    <section aria-label={m.duel_ended_records({}, { locale })}>
      <ul className="grid grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <DuelEndRecordTile key={tile.id} tile={tile} />
        ))}
      </ul>
    </section>
  );
};
