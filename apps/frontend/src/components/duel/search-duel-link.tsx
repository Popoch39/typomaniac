import { Link } from "@tanstack/react-router";

import { useChooseDuel } from "@/components/duel/use-choose-duel";
import { Button } from "@/components/ui/button";

// Back from the Duel's URL to the play page with Duel chosen, whose Queue is joined again (Nouveau
// Duel, Chercher un Duel): the click lets the Face-off of the Duel found sound and its Match
// proposal notify.
export const SearchDuelLink = ({ label }: { label: string }) => {
  const chooseDuel = useChooseDuel();

  return (
    <Button variant="outline" nativeButton={false} render={<Link to="/" onClick={chooseDuel} />}>
      {label}
    </Button>
  );
};
