import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useLayoutEffect, useRef } from "react";

import type { CaretPosition } from "@/components/run/use-text-layout";

gsap.registerPlugin(useGSAP);

// How long a caret glides from one letter to the next, in seconds.
const GLIDE = 0.1;

// Moves one caret: to a spot, gliding, or at once when `jump`.
type CaretMover = (x: number, y: number, jump: boolean) => void;

const moverOf = (caret: HTMLElement, duration: number): CaretMover => {
  const toX = gsap.quickTo(caret, "x", { duration, ease: "power1.out" });
  const toY = gsap.quickTo(caret, "y", { duration, ease: "power1.out" });

  return (x, y, jump) => {
    // From the spot itself: nothing left to glide.
    if (jump) {
      toX(x, x);
      toY(y, y);
    } else {
      toX(x);
      toY(y);
    }
  };
};

// Where a caret stands in the Text: before its letter, or just past the last one (extra letters
// included) once the word is typed. Offsets are the Text's, the letters' offset parent. Null when
// its word is not on the rows shown.
const spotOf = (text: HTMLElement, { wordIndex, letterIndex }: CaretPosition) => {
  const word = text.querySelector(`[data-word="${wordIndex}"]`);

  if (!(word instanceof HTMLElement)) {
    return null;
  }

  const letter = word.children[letterIndex];
  const last = word.lastElementChild;

  if (letter instanceof HTMLElement) {
    return { x: letter.offsetLeft, y: letter.offsetTop };
  }

  // One px further than before a letter, as the board draws it.
  return last instanceof HTMLElement
    ? { x: last.offsetLeft + last.offsetWidth + 1, y: last.offsetTop }
    : { x: word.offsetLeft, y: word.offsetTop };
};

const place = (
  text: HTMLElement | null,
  move: CaretMover | undefined,
  position: CaretPosition,
  jump: boolean,
) => {
  const spot = text === null ? null : spotOf(text, position);

  if (spot !== null && typeof move !== "undefined") {
    move(spot.x, spot.y, jump);
  }
};

// What the rows show: the first word on them, and whether the opponent's caret is on them.
type ShownRows = { firstWord: number; opponentShown: boolean };

// Places both carets of the Duel's Text on every Keystroke. The positions are written to the DOM by
// GSAP, never through a re-render: each caret glides from letter to letter, and jumps when the
// rows move on, under reduced motion, and for the opponent's when it comes back on the rows.
export const useDuelCarets = (
  textRef: RefObject<HTMLDivElement | null>,
  own: CaretPosition,
  opponent: CaretPosition,
  { firstWord, opponentShown }: ShownRows,
) => {
  const caretRef = useRef<HTMLSpanElement>(null);
  const opponentCaretRef = useRef<HTMLSpanElement>(null);
  const movers = useRef<{ own: CaretMover; opponent: CaretMover } | null>(null);
  const placedOn = useRef<ShownRows>({ firstWord, opponentShown });

  useGSAP(
    () => {
      const caret = caretRef.current;
      const opponentCaret = opponentCaretRef.current;

      if (caret === null || opponentCaret === null) {
        return;
      }

      gsap.matchMedia().add(
        {
          glide: "(prefers-reduced-motion: no-preference)",
          still: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const duration = context.conditions?.glide === true ? GLIDE : 0;

          movers.current = {
            own: moverOf(caret, duration),
            opponent: moverOf(opponentCaret, duration),
          };

          return () => {
            movers.current = null;
          };
        },
      );
    },
    { scope: textRef },
  );

  const { wordIndex, letterIndex } = own;
  const opponentWordIndex = opponent.wordIndex;
  const opponentLetterIndex = opponent.letterIndex;

  useLayoutEffect(() => {
    const moved = placedOn.current.firstWord !== firstWord;
    const back = !placedOn.current.opponentShown;

    placedOn.current = { firstWord, opponentShown };
    place(textRef.current, movers.current?.own, { wordIndex, letterIndex }, moved);
    place(
      textRef.current,
      movers.current?.opponent,
      { wordIndex: opponentWordIndex, letterIndex: opponentLetterIndex },
      moved || back,
    );
  }, [
    textRef,
    wordIndex,
    letterIndex,
    opponentWordIndex,
    opponentLetterIndex,
    firstWord,
    opponentShown,
  ]);

  return { caretRef, opponentCaretRef };
};
