import { DuelClock } from "@/components/duel/duel-clock";
import { DuelConnection } from "@/components/duel/duel-connection";
import { DuelLiveScore } from "@/components/duel/duel-live-score";
import { DuelText } from "@/components/duel/duel-text";
import { OpponentWpm } from "@/components/duel/opponent-wpm";
import { LeaveDuel } from "@/components/duel/leave-duel";
import { useDuelElapsed } from "@/components/duel/use-duel-elapsed";
import { FaceOff } from "@/components/face-off/face-off";
import type { FaceOffPairing } from "@/components/face-off/face-off-pairing";
import { beforeCountdown } from "@/components/face-off/face-off-timeline";
import { MatchProposalGo } from "@/components/match-proposal/match-proposal-go";
import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { useTypingFocus } from "@/components/run/use-typing-focus";
import { atHandle } from "@/lib/at-handle";
import type { DuelPlay } from "@/stores/duel-store";
import { useDuelStore } from "@/stores/duel-store";

type DuelTypingAreaProps = Pick<DuelPlay, "id" | "opponent" | "startsAt"> & {
  pairing: FaceOffPairing;
  seconds: number;
};

// The Duel from the Countdown to the end: the same Text for both, typing blocked until the start.
// It stays mounted from the Countdown on, so the typing input keeps the focus at the start. The
// Face-off covers it during the Countdown, a new one for each Duel. A Duel of the Queue starts with
// « C'est parti ! » the second before.
export const DuelTypingArea = ({
  id,
  opponent,
  pairing,
  startsAt,
  seconds,
}: DuelTypingAreaProps) => {
  const { inputRef, focused, setFocused, focus } = useTypingFocus();
  const press = useDuelStore((store) => store.press);
  const elapsed = useDuelElapsed(startsAt);
  const opponentLabel = atHandle(opponent.handle);

  return (
    <div className="flex flex-col gap-4">
      {beforeCountdown(elapsed) ? <MatchProposalGo opponent={opponent} pairing={pairing} /> : null}
      <FaceOff
        key={id}
        opponent={opponent}
        pairing={pairing}
        startsAt={startsAt}
        elapsed={elapsed}
      />
      <DuelConnection opponent={opponentLabel} />
      <KeystrokeInput ref={inputRef} onFocusChange={setFocused} onPress={press} />
      <div className="flex items-baseline justify-between">
        <DuelClock elapsed={elapsed} seconds={seconds} />
        <OpponentWpm name={opponentLabel} elapsed={elapsed} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DuelLiveScore name="Toi" />
        <DuelLiveScore name={opponentLabel} opponent />
      </div>
      <div className="relative rounded-card bg-card px-8 py-6">
        <DuelText />
        {focused ? null : <FocusOverlay onResume={focus} />}
      </div>
      <div className="flex justify-center">
        <LeaveDuel />
      </div>
    </div>
  );
};
