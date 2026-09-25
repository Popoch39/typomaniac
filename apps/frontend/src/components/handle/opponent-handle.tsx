import { HandleLink } from "@/components/handle/handle-link";
import { opponentName } from "@/lib/opponent-name";
import { cn } from "cn";

type OpponentHandleProps = { opponent: { handle: string } | null; className?: string };

// The opponent of a finished Duel: their Handle leads to their Profile, a deleted User to nothing.
export const OpponentHandle = ({ opponent, className }: OpponentHandleProps) =>
  opponent ? (
    <HandleLink handle={opponent.handle} className={className} />
  ) : (
    <span className={cn("text-muted-foreground", className)}>{opponentName(opponent)}</span>
  );
