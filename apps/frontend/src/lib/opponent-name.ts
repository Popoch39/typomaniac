import { atHandle } from "@/lib/at-handle";

// How a finished Duel names the opponent: by their Handle of today, or as gone once their User is
// deleted.
export const opponentName = (opponent: { handle: string } | null) =>
  opponent ? atHandle(opponent.handle) : "User supprimé";
