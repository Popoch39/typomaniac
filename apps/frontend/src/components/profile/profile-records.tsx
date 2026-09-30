import { FlameIcon, StarIcon, ZapIcon } from "lucide-react";
import { useId } from "react";

import type { Stats } from "@/api/profile";
import { PROFILE_CARD_LABEL_PAINT } from "@/components/profile/profile-card-paint";
import { RecordTile } from "@/components/profile/record-tile";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const WPM_ICON = <ZapIcon aria-hidden className="size-6.5" />;

const SCORE_ICON = <StarIcon aria-hidden className="size-6.5" />;

const COMBO_ICON = <FlameIcon aria-hidden className="size-6.5" />;

// The User's Records, under their title: their best wpm, Score and Combo, each on its tile.
export const ProfileRecords = ({ records }: { records: Stats["records"] }) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3.5">
      <h2 id={titleId} className={PROFILE_CARD_LABEL_PAINT}>
        {m.profile_records_title({}, { locale })}
      </h2>
      <dl className="grid grid-cols-3 gap-5">
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
