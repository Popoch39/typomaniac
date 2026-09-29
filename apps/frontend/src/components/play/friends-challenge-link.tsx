import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";

const CHALLENGE_LOOK = "mt-1.5 h-12";

// Défier un Friend: to Friends, where the Friends online are challenged. A Visitor has no Friends:
// asked to sign in instead.
export const FriendsChallengeLink = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);
  const label = m.play_friends_challenge({}, { locale });

  return me === null ? (
    <Button variant="secondary" className={CHALLENGE_LOOK} onClick={() => setSignInOpen(true)}>
      {label}
    </Button>
  ) : (
    <Button
      variant="secondary"
      nativeButton={false}
      render={<Link to="/friends" />}
      className={CHALLENGE_LOOK}
    >
      {label}
    </Button>
  );
};
