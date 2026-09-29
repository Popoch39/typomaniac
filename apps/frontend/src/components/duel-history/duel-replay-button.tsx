import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";

// Opens the Replay of the chosen Duel, the main action of its details.
export const DuelReplayButton = ({ duelId }: { duelId: string }) => (
  <Button
    size="lg"
    className="self-start rounded-[14px] text-[15px] font-bold"
    nativeButton={false}
    render={<Link to="/duels/$duelId" params={{ duelId }} />}
  >
    <Play aria-hidden="true" className="fill-current" />
    Revoir le Replay
  </Button>
);
