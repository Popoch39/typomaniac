import { useState } from "react";

import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { ForcedReducedMotionContext } from "@/components/motion/reduced-motion-context";
import { TierUp } from "@/components/tier-up/tier-up";
import type { DevTierUp } from "@/components/tier-up-dev/dev-tier-ups";
import { TierUpDevControls } from "@/components/tier-up-dev/tier-up-dev-controls";
import { TierUpDevList } from "@/components/tier-up-dev/tier-up-dev-list";

// The last Tier-up played, and how many times: each play mounts it anew, from its start.
type Played = { tierUp: DevTierUp; run: number; open: boolean };

// Plays the real Tier-up of any of the six, on made-up ranks, as often as asked: the click that
// plays it unlocks its sounds, as the one leading to a Duel does.
export const TierUpDevBench = () => {
  const sounds = useFaceOffSounds();
  const [played, setPlayed] = useState<Played | null>(null);
  const [forced, setForced] = useState(false);

  const play = (tierUp: DevTierUp) => {
    sounds.unlock();
    setPlayed((last) => ({ tierUp, run: (last?.run ?? 0) + 1, open: true }));
  };

  const close = () => setPlayed((last) => (last === null ? null : { ...last, open: false }));

  return (
    <>
      <TierUpDevControls
        onReplay={played === null ? null : () => play(played.tierUp)}
        forcedReducedMotion={forced}
        onForcedReducedMotion={setForced}
      />
      <TierUpDevList onPlay={play} />
      {played?.open === true ? (
        <ForcedReducedMotionContext value={forced}>
          <TierUp
            key={played.run}
            from={played.tierUp.from}
            to={played.tierUp.to}
            onClose={close}
          />
        </ForcedReducedMotionContext>
      ) : null}
    </>
  );
};
