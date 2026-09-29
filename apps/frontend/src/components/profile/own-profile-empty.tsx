import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// No finished Duel yet on one's own Profile: the Stats come with the first one.
export const OwnProfileEmpty = () => {
  const locale = useLocale();

  return (
    <EmptyState
      title={m.profile_empty_title({}, { locale })}
      reason={m.profile_empty_own_reason({}, { locale })}
      action={
        <Button nativeButton={false} render={<Link to="/" />}>
          {m.profile_empty_own_action({}, { locale })}
        </Button>
      }
    />
  );
};
