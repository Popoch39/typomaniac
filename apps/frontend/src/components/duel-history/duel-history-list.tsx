import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelHistoryItem } from "@/components/duel-history/duel-history-item";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type DuelHistoryListProps = {
  duels: DuelHistoryEntry[];
  chosenId: string;
  onChoose: (duelId: string) => void;
};

// The User's finished Duels in one card, the most recent first, the chosen one highlighted.
export const DuelHistoryList = ({ duels, chosenId, onChoose }: DuelHistoryListProps) => {
  const locale = useLocale();

  return (
    <ol
      aria-label={m.duel_history_label({}, { locale })}
      className="flex flex-col gap-0.5 rounded-card bg-card p-2"
    >
      {duels.map((duel) => (
        <DuelHistoryItem
          key={duel.id}
          duel={duel}
          chosen={duel.id === chosenId}
          onChoose={() => onChoose(duel.id)}
        />
      ))}
    </ol>
  );
};
