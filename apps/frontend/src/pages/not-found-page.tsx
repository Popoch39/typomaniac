import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// An address no route answers: an old link, or one mistyped. The way out is the home page.
export const NotFoundPage = () => {
  const locale = useLocale();

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col py-12">
      <ErrorState
        title={m.not_found_title({}, { locale })}
        happened={m.not_found_happened({}, { locale })}
        cost={m.not_found_cost({}, { locale })}
        action={
          <Button variant="outline" nativeButton={false} render={<Link to="/" />}>
            {m.not_found_action({}, { locale })}
          </Button>
        }
      />
    </section>
  );
};
