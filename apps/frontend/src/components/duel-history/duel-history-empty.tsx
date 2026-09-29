import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// No finished Duel yet: the Duel history fills up with each one.
export const DuelHistoryEmpty = () => {
  const locale = useLocale();

  return (
    <EmptyState
      title={m.duel_history_empty_title({}, { locale })}
      reason={m.duel_history_empty_reason({}, { locale })}
      action={
        <Button nativeButton={false} render={<Link to="/" />}>
          {m.duel_history_empty_action({}, { locale })}
        </Button>
      }
    />
  );
};
