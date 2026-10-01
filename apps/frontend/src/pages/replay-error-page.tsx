import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Duel cannot be read: it does not exist, or the User did not play it (the API says 404 for
// both), or the request failed.
export const ReplayErrorPage = () => {
  const locale = useLocale();

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col py-12">
      <ErrorState
        title={m.replay_error_title({}, { locale })}
        happened={m.replay_error_happened({}, { locale })}
        cost={m.replay_error_cost({}, { locale })}
        action={
          <Button variant="outline" nativeButton={false} render={<Link to="/history" />}>
            {m.replay_error_action({}, { locale })}
          </Button>
        }
      />
    </section>
  );
};
