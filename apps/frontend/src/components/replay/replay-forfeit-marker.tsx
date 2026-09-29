import type { ReplayedDuel } from "@/api/duel-history";
import { replaySeconds } from "@/components/replay/replay-seconds";
import { replayForfeit } from "@/components/replay/replay-sides";
import { opponentName } from "@/lib/opponent-name";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under the end of the time bar, where the Replay of a forfeited Duel stops: who left, and when.
// Nothing for a Duel ended by its time.
export const ReplayForfeitMarker = ({ duel }: { duel: ReplayedDuel }) => {
  const locale = useLocale();
  const forfeit = replayForfeit(duel);

  if (forfeit === null) {
    return null;
  }

  const time = replaySeconds(forfeit.at, locale);

  return (
    <p className="-mt-2 self-end text-[13px] text-muted-foreground">
      {forfeit.side === "own"
        ? m.replay_forfeit_own({ time }, { locale })
        : m.replay_forfeit_opponent(
            { opponent: opponentName(duel.opponent, locale), time },
            { locale },
          )}
    </p>
  );
};
