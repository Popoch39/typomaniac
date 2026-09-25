import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ActivityEmptyProps = {
  // The search field, where finding a Friend starts.
  searchInputId: string;
};

// Nothing from the Friends yet: without Friends, or before they play.
export const ActivityEmpty = ({ searchInputId }: ActivityEmptyProps) => (
  <EmptyState
    title="Pas encore d'Activity"
    reason="Les Duels et les nouvelles amitiés de tes Friends apparaîtront ici."
    action={
      <Button onClick={() => document.getElementById(searchInputId)?.focus()}>
        Chercher un Friend
      </Button>
    }
  />
);
