import { Link } from "@tanstack/react-router";
import { PLACEMENT_DUELS } from "ranked";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Nobody past Placement yet: the Classement fills with the Duels of the Queue.
export const LeaderboardEmpty = () => {
  const locale = useLocale();

  return (
    <EmptyState
      title={m.leaderboard_empty_title({}, { locale })}
      reason={m.leaderboard_empty_reason(
        { duels: numberFormat(locale).format(PLACEMENT_DUELS) },
        { locale },
      )}
      action={
        <Button nativeButton={false} render={<Link to="/" />}>
          {m.leaderboard_empty_action({}, { locale })}
        </Button>
      }
    />
  );
};
