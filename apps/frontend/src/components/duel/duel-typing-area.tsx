import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useBandMorphRecorder } from "@/components/duel/use-band-morph-recorder";
import { useDuelCues } from "@/components/duel/use-duel-cues";
import { useDuelElapsed } from "@/components/duel/use-duel-elapsed";
import { duelHudModel } from "@/components/duel-hud/duel-hud-model";
import { DuelRoundHud } from "@/components/round-break/duel-round-hud";
import { RoundBreak } from "@/components/round-break/round-break";
import { useRoundMorphRecorder } from "@/components/round-break/use-round-morph-recorder";
import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { useTypingFocus } from "@/components/run/use-typing-focus";
import type { DuelPlay, NextRound } from "@/stores/duel-store";
import { useDuelStore } from "@/stores/duel-store";

type DuelTypingAreaProps = {
  duel: DuelPlay;
  // During a Round break, the next Round: the board of the series takes the HUD's place.
  next: NextRound | null;
};

// The Duel from the Countdown to the end: the same Text for both, typing blocked until the start.
// It stays mounted from the Countdown on, Round breaks included, so the typing input keeps the
// focus at each start. The Face-off covers it during the Countdown, from the Duel's bridge
// (DuelBridge), above the pages. The HUD is drawn from the Duel as the store holds it, the Cues
// the bus hands out for both sides in the Round being played, and this User's Handle read without
// ever holding it up. Once the time is up, it says the end until the server ends the Round. Its
// Score band is recorded as it leaves: the Duel end's comes out of it, the Round break's header
// too, and the next Round's band out of that header. Each frame lets the store start and end the
// Rounds.
export const DuelTypingArea = ({ duel, next }: DuelTypingAreaProps) => {
  const { inputRef, veiled, setFocused, focus } = useTypingFocus();
  const { data: me } = useQuery(meQueryOptions);
  const press = useDuelStore((store) => store.press);
  const leave = useDuelStore((store) => store.leave);
  const elapsed = useDuelElapsed(duel.startsAt);
  const cues = useDuelCues(`${duel.id}/${duel.roundIndex}`);

  useBandMorphRecorder();
  useRoundMorphRecorder();

  // The Face-off's panels shake: the HUD keeps the Text unpainted until the start.
  return (
    <div className="flex flex-1 flex-col">
      <KeystrokeInput ref={inputRef} onFocusChange={setFocused} onPress={press} />
      {next === null ? (
        <DuelRoundHud
          model={duelHudModel(duel, { selfHandle: me?.handle ?? null, cues, elapsed })}
          veil={veiled ? <FocusOverlay onResume={focus} /> : null}
          onLeave={leave}
        />
      ) : (
        <RoundBreak duel={duel} next={next} onLeave={leave} />
      )}
    </div>
  );
};
