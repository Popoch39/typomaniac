import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type FriendsEmptyProps = {
  // The search field, where looking for a User starts.
  searchInputId: string;
};

// No Friend yet: they come from a User found by their Handle.
export const FriendsEmpty = ({ searchInputId }: FriendsEmptyProps) => (
  <EmptyState
    title="Pas encore de Friends"
    reason="Cherche un User par son Handle et envoie-lui une Friend request."
    action={
      <Button onClick={() => document.getElementById(searchInputId)?.focus()}>
        Chercher un User
      </Button>
    }
  />
);
