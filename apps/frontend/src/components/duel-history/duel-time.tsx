import { dateFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

const ENDED_AT = { dateStyle: "medium", timeStyle: "short" } as const;

// When a finished Duel ended, as the Duels page and the Replay write it, in the Locale:
// « 27 sept. 2026, 21:14 », "Sep 27, 2026, 9:14 PM".
export const DuelTime = ({ endedAt }: { endedAt: number }) => {
  const locale = useLocale();

  return (
    <time dateTime={new Date(endedAt).toISOString()}>
      {dateFormat(locale, ENDED_AT).format(endedAt)}
    </time>
  );
};
