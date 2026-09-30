import { Link } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";

import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Over the whole card « Ta place »: a link to the reader's own page of the Leaderboard, where their
// line is brought into view. The page keeps its scroll: the line is scrolled to, not the top.
export const LeaderboardPlaceLink = () => {
  const locale = useLocale();

  return (
    <Link
      to="/leaderboard"
      search={{ at: "me" }}
      resetScroll={false}
      aria-label={m.leaderboard_place_go({}, { locale })}
      className="absolute inset-0 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <LocateFixed
        aria-hidden
        className="absolute top-5 right-5.5 size-4 text-muted-foreground transition-colors group-hover/place:text-primary"
      />
    </Link>
  );
};
