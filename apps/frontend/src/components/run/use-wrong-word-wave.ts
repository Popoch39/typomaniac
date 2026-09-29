import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";
import type { RunState } from "typing-engine";

import { BOARD_EASE } from "@/components/duel-hud/board-ease";

gsap.registerPlugin(useGSAP);

// How long the wave takes to be drawn under a word just validated, and to be taken off a word
// reopened, in seconds.
const DRAW = 0.2;

const RETRACT = 0.15;

// The wave of a Wrong word: drawn from left to right on the space that validates it, taken off
// from right to left, towards the caret, when backspace reopens it (the only word that reopens);
// at once under reduced motion. It follows the Run, not the Cues: the Replay emits none. Any other
// change (several words at once, a new Text, the first render) is not animated: the CSS sets the
// state, so a word shown without having just been validated has its wave already drawn.
export const useWrongWordWave = (
  textRef: RefObject<HTMLElement | null>,
  { config, validatedWords }: Pick<RunState, "config" | "validatedWords">,
) => {
  // The Text by what draws it, not by its config: the Replay builds a new one on each frame.
  const { language, wordListVersion, seed, text } = config;
  const textKey = `${language}:${wordListVersion}:${seed}`;
  const seen = useRef({ textKey, text, validatedWords });

  useGSAP(
    () => {
      const before = seen.current;

      seen.current = { textKey, text, validatedWords };

      const step = validatedWords - before.validatedWords;
      const sameText = before.textKey === textKey && before.text === text;

      if (!sameText || Math.abs(step) !== 1) {
        return;
      }

      // The word just validated, or the one reopened: a word only has a wave typed wrong, so once
      // validated, a Wrong word.
      const index = Math.min(validatedWords, before.validatedWords);
      const wave = textRef.current?.querySelector(`[data-word="${index}"] [data-wave]`) ?? null;

      if (wave === null) {
        return;
      }

      const drawn = step === 1;

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          wave,
          { "--wave": drawn ? 0 : 1 },
          { "--wave": drawn ? 1 : 0, duration: drawn ? DRAW : RETRACT, ease: BOARD_EASE },
        );
      });
    },
    { scope: textRef, dependencies: [textKey, text, validatedWords], revertOnUpdate: true },
  );
};
