import { timeOfDay } from "@/components/history/history-text";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type HistoryDuelMetaProps = { endedAt: number; ranked: boolean; forfeit: boolean };

// Under the opponent on a card: when the Duel ended that day, what kind it was, and its Forfeit.
export const HistoryDuelMeta = ({ endedAt, ranked, forfeit }: HistoryDuelMetaProps) => {
  const locale = useLocale();

  const parts = {
    time: timeOfDay(endedAt, locale),
    kind: ranked ? m.history_card_ranked({}, { locale }) : m.duel_kind_challenge({}, { locale }),
  };

  return (
    <span className="text-xs text-muted-foreground">
      {forfeit
        ? m.history_card_meta_forfeit(parts, { locale })
        : m.history_card_meta(parts, { locale })}
    </span>
  );
};
