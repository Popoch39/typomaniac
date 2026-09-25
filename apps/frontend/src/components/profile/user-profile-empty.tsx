import { EmptyState } from "@/components/ui/empty-state";

// Another User without a finished Duel: nothing to show, nothing for the viewer to do.
export const UserProfileEmpty = () => (
  <EmptyState
    title="Pas encore de Duel"
    reason="Ses Stats apparaîtront après son premier Duel terminé."
  />
);
