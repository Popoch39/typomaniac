import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { Button } from "@/components/ui/button";

type FriendsNavLinkProps = {
  className: string;
};

// The way to the Friends, for a User with a Session only: a Visitor has none.
export const FriendsNavLink = ({ className }: FriendsNavLinkProps) => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me ? (
    <Button
      variant="ghost"
      nativeButton={false}
      className={className}
      render={<Link to="/friends" />}
    >
      Friends
    </Button>
  ) : null;
};
