import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { Button } from "@/components/ui/button";

type DuelsNavLinkProps = {
  className: string;
};

// The way to the Duel history, for a User with a Session only: a Visitor has no Duels.
export const DuelsNavLink = ({ className }: DuelsNavLinkProps) => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me ? (
    <Button
      variant="ghost"
      nativeButton={false}
      className={className}
      render={<Link to="/duels" />}
    >
      Duels
    </Button>
  ) : null;
};
