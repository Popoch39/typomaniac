import { FlameIcon, StarIcon, ZapIcon } from "lucide-react";
import { useId } from "react";

import type { Stats } from "@/api/profile";
import { RecordTile } from "@/components/profile/record-tile";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const WPM_ICON = <ZapIcon aria-hidden className="size-6" />;

const SCORE_ICON = <StarIcon aria-hidden className="size-6" />;

const COMBO_ICON = <FlameIcon aria-hidden className="size-6" />;

// The User's Records, under the win rate and the accuracy: their best wpm, Score and Combo, each on
// its own tile of the bento. Named for screen readers: each tile says what it holds.
export const ProfileRecords = ({ records }: { records: Stats["records"] }) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="col-span-2 min-h-0">
      <h2 id={titleId} className="sr-only">
        {m.profile_records_title({}, { locale })}
      </h2>
      <dl className="grid h-full grid-cols-3 gap-4">
        <RecordTile
          icon={WPM_ICON}
          term={m.profile_stat_best_wpm({}, { locale })}
          value={records.wpm}
        />
        <RecordTile
          icon={SCORE_ICON}
          term={m.profile_stat_best_score({}, { locale })}
          value={records.score}
        />
        <RecordTile
          icon={COMBO_ICON}
          term={m.profile_stat_best_combo({}, { locale })}
          value={records.combo}
        />
      </dl>
    </section>
  );
};
