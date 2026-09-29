import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// No User holds this Handle: never taken, or given up.
export const UserProfileNotFoundPage = () => {
  const locale = useLocale();

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col py-12">
      <ErrorState
        title={m.profile_not_found_title({}, { locale })}
        happened={m.profile_not_found_happened({}, { locale })}
        cost={m.profile_not_found_cost({}, { locale })}
        action={
          <Button variant="outline" nativeButton={false} render={<Link to="/friends" />}>
            {m.profile_not_found_action({}, { locale })}
          </Button>
        }
      />
    </section>
  );
};
