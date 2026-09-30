import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useState } from "react";
import { type Keystroke, keystrokesUpTo } from "typing-engine";

import { reducedMotion, useForcedReducedMotion } from "@/components/motion/reduced-motion-context";

gsap.registerPlugin(useGSAP);

// How long the excerpt holds once typed, before it starts again, in seconds.
export const GHOST_PAUSE_SECONDS = 1.5;

// Where the excerpt rests when nothing moves: typed to its end (the Ghost), or not at all (the
// glimpse's caret, at its start).
type StillAt = "end" | "start";

// How many of the first `length` Keystrokes are shown typed: a GSAP timeline plays them at their
// own pace, holds the end a pause, then starts again, for as long as the excerpt is mounted (killed
// with it). Under reduced motion, preferred or forced, nothing moves: the excerpt rests at
// `stillAt`.
export const useGhostTyping = (
  scope: RefObject<HTMLElement | null>,
  keystrokes: readonly Keystroke[],
  length: number,
  stillAt: StillAt,
) => {
  const forced = useForcedReducedMotion();
  // Null while still.
  const [typed, setTyped] = useState<number | null>(() => (reducedMotion(forced) ? null : 0));

  useGSAP(
    () => {
      if (forced) {
        setTyped(null);

        return;
      }

      const typing = keystrokes.slice(0, length);
      const end = typing.at(-1)?.at;

      if (end === undefined) {
        return;
      }

      gsap.matchMedia().add(
        {
          moving: "(prefers-reduced-motion: no-preference)",
          still: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.still) {
            setTyped(null);

            return;
          }

          const playhead = { t: 0 };

          setTyped(0);
          gsap.timeline({ repeat: -1, repeatDelay: GHOST_PAUSE_SECONDS }).to(playhead, {
            t: end,
            duration: end / 1000,
            ease: "none",
            lazy: false,
            onUpdate: () => setTyped(keystrokesUpTo(typing, playhead.t).length),
          });
        },
      );
    },
    { scope, dependencies: [keystrokes, length, forced], revertOnUpdate: true },
  );

  if (typed === null) {
    return stillAt === "end" ? length : 0;
  }

  return Math.min(typed, length);
};
