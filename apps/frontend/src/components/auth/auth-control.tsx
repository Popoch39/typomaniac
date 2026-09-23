import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export const AuthControl = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  return me ? (
    <UserMenu me={me} />
  ) : (
    <Button variant="outline" onClick={() => setSignInOpen(true)}>
      Se connecter
    </Button>
  );
};
