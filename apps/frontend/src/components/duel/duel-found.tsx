import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";
import type { DuelState } from "@/stores/duel-store";

type DuelFoundProps = {
  opponent: Extract<DuelState, { phase: "found" }>["opponent"];
};

// Paired: who the opponent is. The Countdown and the typing come with the synchronised Duel.
export const DuelFound = ({ opponent }: DuelFoundProps) => (
  <output className="flex flex-col items-center gap-4 py-12">
    <Avatar size="lg">
      {opponent.image ? <AvatarImage src={opponent.image} alt="" /> : null}
      <AvatarFallback>{initials(opponent.name)}</AvatarFallback>
    </Avatar>
    <span className="text-lg">
      Duel contre <span className="font-bold text-caret">{opponent.name}</span>
    </span>
  </output>
);
