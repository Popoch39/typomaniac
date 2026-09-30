import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { useChooseDuel } from "@/components/duel/use-choose-duel";
import { Button } from "@/components/ui/button";

type SearchDuelLinkProps = { label: string } & Pick<
  ComponentProps<typeof Button>,
  "variant" | "className"
>;

// Back from the Duel's URL to the play page with Duel chosen, whose Queue is joined again (Nouveau
// Duel, Chercher un Duel): the click lets the Face-off of the Duel found sound and its Match
// proposal notify.
export const SearchDuelLink = ({ label, variant = "outline", className }: SearchDuelLinkProps) => {
  const chooseDuel = useChooseDuel();

  return (
    <Button
      variant={variant}
      className={className}
      nativeButton={false}
      render={<Link to="/" onClick={chooseDuel} />}
    >
      {label}
    </Button>
  );
};
