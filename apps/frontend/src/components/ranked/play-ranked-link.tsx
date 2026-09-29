import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import type { MouseEvent } from "react";

import { meQueryOptions } from "@/api/me";
import { useDuelSearchGesture } from "@/components/duel/use-duel-search-gesture";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayStore } from "@/stores/play-store";

// « Jouer en Ranked »: the play page with the Duel chosen, whose screen joins the Queue. A Duel
// needs an account: a Visitor is asked to sign in instead, and stays.
export const PlayRankedLink = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const setPlay = usePlayStore((state) => state.setPlay);
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);
  const searchGesture = useDuelSearchGesture();

  const play = (event: MouseEvent<HTMLAnchorElement>) => {
    if (me === null) {
      event.preventDefault();
      setSignInOpen(true);

      return;
    }

    // As the Duel of the play page's settings: this click lets the Face-off sound and the Match
    // proposal notify.
    searchGesture();
    setPlay("duel");
  };

  return (
    <Link
      to="/"
      onClick={play}
      className="mt-auto flex h-12 items-center justify-between border-b-2 border-primary px-1 text-lg font-semibold text-foreground"
    >
      Jouer en Ranked
      <ArrowRightIcon aria-hidden="true" className="size-5 text-primary" />
    </Link>
  );
};
