import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

// The chosen Duel could not be read: its Duel chart and Results are missing, the rest of the page
// stays.
export const DuelDetailsError = ({ onRetry }: { onRetry: () => void }) => (
  <ErrorState
    heading="h3"
    title="Duel illisible"
    happened="Son Duel chart et ses Results n'ont pas pu être lus."
    cost="Ta Duel history, elle, est intacte : réessaie, ou choisis un autre Duel."
    action={
      <Button variant="outline" onClick={onRetry}>
        Réessayer
      </Button>
    }
  />
);
