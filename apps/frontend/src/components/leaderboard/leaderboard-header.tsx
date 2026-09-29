import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The top of the Classement, loaded or not.
export const LeaderboardHeader = () => {
  const locale = useLocale();

  return (
    <PageHeader
      title={m.leaderboard_title({}, { locale })}
      subtitle={m.leaderboard_subtitle({}, { locale })}
    />
  );
};
