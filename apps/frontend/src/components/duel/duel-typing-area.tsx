import { DuelClock } from "@/components/duel/duel-clock";
import { DuelFound } from "@/components/duel/duel-found";
import { DuelText } from "@/components/duel/duel-text";
import { OpponentWpm } from "@/components/duel/opponent-wpm";
import { useDuelElapsed } from "@/components/duel/use-duel-elapsed";
import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { useTypingFocus } from "@/components/run/use-typing-focus";
import type { DuelPlay } from "@/stores/duel-store";
import { useDuelStore } from "@/stores/duel-store";

type DuelTypingAreaProps = Pick<DuelPlay, "opponent" | "startsAt"> & { seconds: number };

// The Duel from the Countdown to the end: the same Text for both, typing blocked until the start.
// It stays mounted from the Countdown on, so the typing input keeps the focus at the start.
export const DuelTypingArea = ({ opponent, startsAt, seconds }: DuelTypingAreaProps) => {
  const { inputRef, focused, setFocused, focus } = useTypingFocus();
  const press = useDuelStore((store) => store.press);
  const elapsed = useDuelElapsed(startsAt);

  return (
    <div className="flex flex-col gap-4">
      <DuelFound opponent={opponent} />
      <KeystrokeInput ref={inputRef} onFocusChange={setFocused} onPress={press} />
      <div className="flex items-baseline justify-between">
        <DuelClock elapsed={elapsed} seconds={seconds} />
        <OpponentWpm name={opponent.name} elapsed={elapsed} />
      </div>
      <div className="relative">
        <DuelText />
        {focused ? null : <FocusOverlay onResume={focus} />}
      </div>
    </div>
  );
};
