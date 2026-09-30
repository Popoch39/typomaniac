import { StarIcon } from "lucide-react";

import { DuelEndRecordStamp } from "@/components/duel-end/duel-end-record-stamp";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « Record » stamped beside this User's Score in the band, its star filled: the Duel beat their
// best Score.
export const DuelEndScoreRecord = () => {
  const locale = useLocale();

  return (
    <DuelEndRecordStamp className="mb-1.5 flex -rotate-6 items-center gap-2 rounded-[12px] px-3.5 py-2 text-sm">
      <StarIcon aria-hidden="true" className="size-4 fill-current" strokeWidth={0} />
      {m.duel_ended_record({}, { locale })}
    </DuelEndRecordStamp>
  );
};
