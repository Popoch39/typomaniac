import { useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A page whose loading failed, the API out of reach or broken, where no route says better: its
// loaders run again on Réessayer. The shell's own, `/me` at the root, falls here too.
export const ErrorPage = () => {
  const router = useRouter();
  const locale = useLocale();

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col py-12">
      <ErrorState
        title={m.error_page_title({}, { locale })}
        happened={m.error_page_happened({}, { locale })}
        cost={m.error_page_cost({}, { locale })}
        action={
          <Button variant="outline" onClick={() => void router.invalidate()}>
            {m.error_page_retry({}, { locale })}
          </Button>
        }
      />
    </section>
  );
};
