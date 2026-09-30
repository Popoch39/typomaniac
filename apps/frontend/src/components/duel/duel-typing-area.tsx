import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useDuelCues } from "@/components/duel/use-duel-cues";
import { useDuelElapsed } from "@/components/duel/use-duel-elapsed";
import { DuelHud } from "@/components/duel-hud/duel-hud";
import { duelHudModel } from "@/components/duel-hud/duel-hud-model";
import { FaceOff } from "@/components/face-off/face-off";
import { beforeCountdown } from "@/components/face-off/face-off-timeline";
import { MatchProposalGo } from "@/components/match-proposal/match-proposal-go";
import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { useTypingFocus } from "@/components/run/use-typing-focus";
import type { DuelPlay } from "@/stores/duel-store";
import { useDuelStore } from "@/stores/duel-store";

// The Duel from the Countdown to the end: the same Text for both, typing blocked until the start.
// It stays mounted from the Countdown on, so the typing input keeps the focus at the start. The
// Face-off covers it during the Countdown, a new one for each Duel. A Duel of the Queue starts with
// « C'est parti ! » the second before. The HUD is drawn from the Duel as the store holds it, the
// Cues the bus hands out for both sides, and this User's Handle read without ever holding it up.
// Once the time is up, it says the end until the server ends the Duel.
export const DuelTypingArea = ({ duel }: { duel: DuelPlay }) => {
  const { inputRef, veiled, setFocused, focus } = useTypingFocus();
  const { data: me } = useQuery(meQueryOptions);
  const press = useDuelStore((store) => store.press);
  const leave = useDuelStore((store) => store.leave);
  const elapsed = useDuelElapsed(duel.startsAt);
  const cues = useDuelCues(duel.id);

  // Neither the non-modal « C'est parti ! » nor the Face-off (its panels slide in, then shake)
  // covers the whole page: the HUD keeps the Text unpainted until the start.
  return (
    <div className="flex flex-1 flex-col">
      {beforeCountdown(elapsed) ? (
        <MatchProposalGo opponent={duel.opponent} pairing={duel} />
      ) : null}
      <FaceOff
        key={duel.id}
        opponent={duel.opponent}
        pairing={duel}
        startsAt={duel.startsAt}
        elapsed={elapsed}
      />
      <KeystrokeInput ref={inputRef} onFocusChange={setFocused} onPress={press} />
      <DuelHud
        model={duelHudModel(duel, { selfHandle: me?.handle ?? null, cues, elapsed })}
        veil={veiled ? <FocusOverlay onResume={focus} /> : null}
        onLeave={leave}
      />
    </div>
  );
};
