import { HistoryFrieze } from "@/components/history/history-frieze";
import { HistoryHeader } from "@/components/history/history-header";
import { HistoryWeekDays } from "@/components/history/history-week-days";
import { HistoryWeekNav } from "@/components/history/history-week-nav";

// The signed-in User's History (B · Journal): their Duels a week at a time, the week chosen on a
// frieze of their last 16 weeks, then its days.
export const HistoryPage = () => (
  <section className="mx-auto flex w-full max-w-300 flex-col gap-8 pt-2 pb-7 font-journal">
    <HistoryHeader nav={<HistoryWeekNav />} />
    <HistoryFrieze />
    <HistoryWeekDays />
  </section>
);
