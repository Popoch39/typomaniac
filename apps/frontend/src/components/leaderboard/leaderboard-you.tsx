import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Next to the reader's own Handle, on the podium or in the list.
export const LeaderboardYou = () => {
  const locale = useLocale();

  return (
    <span className="text-xs font-bold text-primary">{m.leaderboard_you({}, { locale })}</span>
  );
};
