import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { Tier } from "ranked";
import { type RefObject, useRef, useState } from "react";

import type { TierUpSound } from "@/audio/face-off-sounds";
import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import {
  choreographyOf,
  SOUND_BEATS,
  TIER_UP_BEATS,
} from "@/components/tier-up/choreography/tier-up-choreography";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

gsap.registerPlugin(useGSAP);

type TierUpTimelineOptions = {
  // The Tier reached, whose choreography plays.
  tier: Tier;
  // The Tier-up opens as it ends: built, then set at its end, without loops, and only its impact
  // heard.
  reducedMotion: boolean;
  // « Continuer », which takes the focus once the intro is over.
  proceed: RefObject<HTMLButtonElement | null>;
};

// Plays the Tier-up inside `scope` once, on GSAP's clock, from mount: its choreography's timeline,
// every sound a call placed on its label (none while muted), and its idle loops.
// Everything is reverted on unmount. `settled` once the intro is over, on its own at the wait, or
// by `skip`, which sends the timeline straight to its wait: the calls passed over never run, so
// the sounds left never play, and the loops go on from there. Either way, the focus goes to
// « Continuer ».
export const useTierUpTimeline = (
  scope: RefObject<HTMLDivElement | null>,
  { tier, reducedMotion, proceed }: TierUpTimelineOptions,
) => {
  const sounds = useFaceOffSounds();
  const [settled, setSettled] = useState(reducedMotion);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  // Kept across Strict Mode's second run: the single sound of a still Tier-up plays once.
  const heardStill = useRef(false);

  const settle = () => {
    setSettled(true);
    proceed.current?.focus();
  };

  useGSAP(
    () => {
      const choreography = choreographyOf(tier);
      // Not lazy: every part takes its starting state before the first paint, never a frame of
      // the end shown first.
      const built = gsap.timeline({ defaults: { ease: "none", lazy: false } });

      const play = (sound: TierUpSound) => {
        if (!useFaceOffSoundStore.getState().muted) {
          sounds.play(sound);
        }
      };

      for (const beat of TIER_UP_BEATS) {
        built.addLabel(beat, choreography.beats[beat]);
      }

      choreography.intro(built);

      for (const beat of SOUND_BEATS) {
        built.call(play, [choreography.sounds[beat]], beat);
      }

      for (const { sound, at } of choreography.cues) {
        built.call(play, [sound], at);
      }

      built.call(settle, [], "wait");
      timeline.current = built;

      if (!reducedMotion) {
        choreography.idle(built);

        return;
      }

      built.progress(1, true);

      if (!heardStill.current) {
        heardStill.current = true;
        play(choreography.sounds.impact);
      }
    },
    { scope, dependencies: [reducedMotion, sounds, tier] },
  );

  const skip = () => {
    timeline.current?.seek("wait");
    settle();
  };

  return { settled, skip };
};
