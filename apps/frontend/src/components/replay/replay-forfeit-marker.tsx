import type { ReplayedDuel } from "@/api/duel-history";
import { replaySeconds } from "@/components/replay/replay-seconds";
import { replayForfeit } from "@/components/replay/replay-sides";
import { opponentName } from "@/lib/opponent-name";

// Under the end of the time bar, where the Replay of a forfeited Duel stops: who left, and when.
// Nothing for a Duel ended by its time.
export const ReplayForfeitMarker = ({ duel }: { duel: ReplayedDuel }) => {
  const forfeit = replayForfeit(duel);

  if (forfeit === null) {
    return null;
  }

  return (
    <p className="self-end text-sm text-muted-foreground">
      {forfeit.side === "own" ? "Toi" : opponentName(duel.opponent)} : abandon à{" "}
      {replaySeconds(forfeit.at)}
    </p>
  );
};
