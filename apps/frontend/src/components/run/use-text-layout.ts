import { useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from "react";

import { readTextLayout } from "@/components/run/text-layout";

// Where a caret stands in the Text.
export type CaretPosition = { wordIndex: number; letterIndex: number };

type TextRefs = {
  scrollRef: RefObject<HTMLDivElement | null>;
  wordsRef: RefObject<HTMLDivElement | null>;
  caretRef: RefObject<HTMLSpanElement | null>;
  opponentCaretRef: RefObject<HTMLSpanElement | null>;
};

// The opponent's caret goes where their letter is in this User's Text, hidden when it is past
// the words drawn here. Only this User's caret scrolls the Text.
const placeOpponentCaret = (refs: TextRefs, words: HTMLElement, opponent: CaretPosition | null) => {
  const caret = refs.opponentCaretRef.current;

  if (caret === null || opponent === null) {
    return;
  }

  const layout = readTextLayout(words, opponent.wordIndex, opponent.letterIndex);

  caret.hidden = layout === null;

  if (layout !== null) {
    caret.style.transform = `translate(${layout.caretX}px, ${layout.caretY}px)`;
  }
};

const applyTextLayout = (refs: TextRefs, own: CaretPosition, opponent: CaretPosition | null) => {
  const scroll = refs.scrollRef.current;
  const words = refs.wordsRef.current;
  const caret = refs.caretRef.current;

  if (scroll === null || words === null || caret === null) {
    return;
  }

  placeOpponentCaret(refs, words, opponent);

  const layout = readTextLayout(words, own.wordIndex, own.letterIndex);

  if (layout === null) {
    return;
  }

  scroll.style.transform = `translateY(${-layout.scrollY}px)`;
  caret.style.transform = `translate(${layout.caretX}px, ${layout.caretY}px)`;
};

// Effects depend on primitives: the position is rebuilt from them.
const positionOf = (wordIndex: number | null, letterIndex: number | null) =>
  wordIndex === null || letterIndex === null ? null : { wordIndex, letterIndex };

// Places the carets and scrolls the Text on every Keystroke and whenever the lines reflow. The
// transforms are written to the DOM directly: a position never costs a re-render.
export const useTextLayout = (own: CaretPosition, opponent: CaretPosition | null): TextRefs => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const opponentCaretRef = useRef<HTMLSpanElement>(null);
  const { wordIndex, letterIndex } = own;
  const opponentWordIndex = opponent?.wordIndex ?? null;
  const opponentLetterIndex = opponent?.letterIndex ?? null;

  useLayoutEffect(() => {
    applyTextLayout(
      { scrollRef, wordsRef, caretRef, opponentCaretRef },
      { wordIndex, letterIndex },
      positionOf(opponentWordIndex, opponentLetterIndex),
    );
  }, [wordIndex, letterIndex, opponentWordIndex, opponentLetterIndex]);

  const relayout = useEffectEvent(() => {
    applyTextLayout(
      { scrollRef, wordsRef, caretRef, opponentCaretRef },
      { wordIndex, letterIndex },
      positionOf(opponentWordIndex, opponentLetterIndex),
    );
  });

  useEffect(() => {
    const words = wordsRef.current;

    if (words === null) {
      return;
    }

    const observer = new ResizeObserver(() => relayout());

    observer.observe(words);

    return () => observer.disconnect();
  }, []);

  return { scrollRef, wordsRef, caretRef, opponentCaretRef };
};
