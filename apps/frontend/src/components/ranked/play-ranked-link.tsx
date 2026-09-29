import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import type { MouseEvent } from "react";

import { useChooseDuel } from "@/components/duel/use-choose-duel";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « Jouer en Ranked »: the play page with the Duel chosen, whose screen joins the Queue. A Visitor
// is asked to sign in instead, and stays.
export const PlayRankedLink = () => {
  const locale = useLocale();
  const chooseDuel = useChooseDuel();

  const play = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!chooseDuel()) {
      event.preventDefault();
    }
  };

  return (
    <Link
      to="/"
      onClick={play}
      className="mt-auto flex h-12 items-center justify-between border-b-2 border-primary px-1 text-lg font-semibold text-foreground"
    >
      {m.ranked_play({}, { locale })}
      <ArrowRightIcon aria-hidden="true" className="size-5 text-primary" />
    </Link>
  );
};
