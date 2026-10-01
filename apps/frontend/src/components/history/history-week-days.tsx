import { HistoryDay } from "@/components/history/history-day";
import { byDay } from "@/components/history/history-week";
import { HistoryWeekEmpty } from "@/components/history/history-week-empty";
import { useShownWeek } from "@/components/history/use-history-view";

// The Duels of the week shown, a section per day, the most recent first; or why there are none.
export const HistoryWeekDays = () => {
  const { duels } = useShownWeek();

  if (duels.length === 0) {
    return <HistoryWeekEmpty />;
  }

  return byDay(duels).map(({ day, duels: ofDay }) => (
    <HistoryDay key={day} day={day} duels={ofDay} />
  ));
};
