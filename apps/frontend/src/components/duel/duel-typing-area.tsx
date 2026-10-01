import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useBandMorphRecorder } from "@/components/duel/use-band-morph-recorder";
import { useDuelCues } from "@/components/duel/use-duel-cues";
import { useDuelElapsed } from "@/components/duel/use-duel-elapsed";
import { DuelHud } from "@/components/duel-hud/duel-hud";
import { duelHudModel } from "@/components/duel-hud/duel-hud-model";
import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { useTypingFocus } from "@/components/run/use-typing-focus";
import type { DuelPlay } from "@/stores/duel-store";
import { useDuelStore } from "@/stores/duel-store";

// The Duel from the Countdown to the end: the same Text for both, typing blocked until the start.
// It stays mounted from the Countdown on, so the typing input keeps the focus at the start. The
// Face-off covers it during the Countdown, from the Duel's bridge (DuelBridge), above the pages.
// The HUD is drawn from the Duel as the store holds it, the Cues the bus hands out for both sides,
// and this User's Handle read without ever holding it up. Once the time is up, it says the end
// until the server ends the Duel; its Score band is then recorded for the Duel end's to come out
// of it.
export const DuelTypingArea = ({ duel }: { duel: DuelPlay }) => {
  const { inputRef, veiled, setFocused, focus } = useTypingFocus();
  const { data: me } = useQuery(meQueryOptions);
  const press = useDuelStore((store) => store.press);
  const leave = useDuelStore((store) => store.leave);
  const elapsed = useDuelElapsed(duel.startsAt);
  const cues = useDuelCues(`${duel.id}/${duel.roundIndex}`);

  useBandMorphRecorder();

  // The Face-off's panels shake: the HUD keeps the Text unpainted until the start.
  return (
    <div className="flex flex-1 flex-col">
      <KeystrokeInput ref={inputRef} onFocusChange={setFocused} onPress={press} />
      <DuelHud
        model={duelHudModel(duel, { selfHandle: me?.handle ?? null, cues, elapsed })}
        veil={veiled ? <FocusOverlay onResume={focus} /> : null}
        onLeave={leave}
      />
    </div>
  );
};
