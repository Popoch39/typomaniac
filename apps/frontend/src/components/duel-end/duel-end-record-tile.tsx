import { cn } from "cn";
import { FlameIcon, type LucideIcon, StarIcon, ZapIcon } from "lucide-react";

import { DuelEndRecordStamp } from "@/components/duel-end/duel-end-record-stamp";
import type { RecordId, RecordTile } from "@/components/duel-end/record-tiles";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Each Record by its name and icon, as the Profile's tiles show them.
const RECORDS: Record<RecordId, { Icon: LucideIcon; name: typeof m.profile_stat_best_wpm }> = {
  wpm: { Icon: ZapIcon, name: m.profile_stat_best_wpm },
  score: { Icon: StarIcon, name: m.profile_stat_best_score },
  combo: { Icon: FlameIcon, name: m.profile_stat_best_combo },
};

// Under the figure: by how much a beaten Record moved (« premier Record » for a first one), or
// this Duel's figure against the one that holds.
const footnote = (tile: RecordTile, locale: Locale) => {
  const written = (value: number) => numberFormat(locale).format(value);

  if (!tile.beaten) {
    return m.duel_ended_record_this_duel({ value: written(tile.figure) }, { locale });
  }

  return tile.before === null
    ? m.duel_ended_first_record({}, { locale })
    : m.duel_ended_record_before(
        { record: written(tile.before), gain: written(tile.figure - tile.before) },
        { locale },
      );
};

// One Record at the end of the Duel: beaten, on the accent, stamped « Nouveau record », this
// Duel's figure; otherwise plain, the Record that holds.
export const DuelEndRecordTile = ({ tile }: { tile: RecordTile }) => {
  const locale = useLocale();
  const { Icon, name } = RECORDS[tile.id];

  return (
    <li
      className={cn(
        "flex h-[150px] flex-col justify-between rounded-[24px] px-6 py-5",
        tile.beaten ? "bg-brand text-on-brand" : "bg-card text-muted-foreground",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-display text-xs font-bold tracking-[0.1em] uppercase">
          <Icon aria-hidden="true" className="size-5" strokeWidth={2.2} />
          {name({}, { locale })}
        </span>
        {tile.beaten ? (
          <DuelEndRecordStamp className="-rotate-4 rounded-[10px] px-3 py-1.5 text-[11px]">
            {m.duel_ended_new_record({}, { locale })}
          </DuelEndRecordStamp>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "font-display text-5xl leading-none font-black tracking-[-0.03em]",
            tile.beaten ? "text-on-brand" : "text-foreground",
          )}
        >
          {numberFormat(locale).format(tile.beaten ? tile.figure : tile.record)}
        </span>
        <span className="font-mono text-[13px] font-semibold">{footnote(tile, locale)}</span>
      </div>
    </li>
  );
};
