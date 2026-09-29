import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The chosen Duel could not be read: its Duel chart and Results are missing, the rest of the page
// stays.
export const DuelDetailsError = ({ onRetry }: { onRetry: () => void }) => {
  const locale = useLocale();

  return (
    <ErrorState
      heading="h3"
      title={m.duel_details_error_title({}, { locale })}
      happened={m.duel_details_error_happened({}, { locale })}
      cost={m.duel_details_error_cost({}, { locale })}
      action={
        <Button variant="outline" onClick={onRetry}>
          {m.duel_details_retry({}, { locale })}
        </Button>
      }
    />
  );
};
