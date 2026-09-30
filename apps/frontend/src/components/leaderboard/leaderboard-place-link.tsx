import { Link } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// At the foot of « Ta place »: the way to the reader's own page of the Leaderboard, where their
// line is brought into view. The page keeps its scroll: the line is scrolled to, not the top.
export const LeaderboardPlaceLink = () => {
  const locale = useLocale();

  return (
    <Button
      variant="secondary"
      className="w-full"
      nativeButton={false}
      render={<Link to="/leaderboard" search={{ at: "me" }} resetScroll={false} />}
    >
      <LocateFixed aria-hidden data-icon="inline-start" />
      {m.leaderboard_place_go({}, { locale })}
    </Button>
  );
};
