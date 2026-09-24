import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";
import type { DuelOpponent } from "@/stores/duel-store";

// Who the opponent is, above the Duel's Text.
export const DuelFound = ({ opponent }: { opponent: DuelOpponent }) => (
  <output className="flex items-center justify-center gap-3">
    <Avatar>
      {opponent.image ? <AvatarImage src={opponent.image} alt="" /> : null}
      <AvatarFallback>{initials(opponent.name)}</AvatarFallback>
    </Avatar>
    <span className="text-lg">
      Duel contre <span className="font-bold text-opponent-caret">{opponent.name}</span>
    </span>
  </output>
);
