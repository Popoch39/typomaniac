import { useState } from "react";

import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { ForcedReducedMotionContext } from "@/components/motion/reduced-motion-context";
import { TierUp } from "@/components/tier-up/tier-up";
import { TierUpDevControls } from "@/components/tier-up-dev/tier-up-dev-controls";
import { TierUpDevRises } from "@/components/tier-up-dev/tier-up-dev-rises";
import type { TierUpRise } from "@/components/tier-up-dev/tier-up-rises";

// The last Tier-up played, and how many times: each play mounts it anew, from its start.
type Played = { rise: TierUpRise; run: number; open: boolean };

// Plays the real Tier-up of any of the six moves up, on made-up ranks, as often as asked: the
// click that plays it unlocks its sounds, as the one leading to a Duel does.
export const TierUpDevBench = () => {
  const sounds = useFaceOffSounds();
  const [played, setPlayed] = useState<Played | null>(null);
  const [forced, setForced] = useState(false);

  const play = (rise: TierUpRise) => {
    sounds.unlock();
    setPlayed((last) => ({ rise, run: (last?.run ?? 0) + 1, open: true }));
  };

  const close = () => setPlayed((last) => (last === null ? null : { ...last, open: false }));

  return (
    <>
      <TierUpDevControls
        onReplay={played === null ? null : () => play(played.rise)}
        forcedReducedMotion={forced}
        onForcedReducedMotion={setForced}
      />
      <TierUpDevRises onPlay={play} />
      {played?.open === true ? (
        <ForcedReducedMotionContext value={forced}>
          <TierUp key={played.run} from={played.rise.from} to={played.rise.to} onClose={close} />
        </ForcedReducedMotionContext>
      ) : null}
    </>
  );
};
