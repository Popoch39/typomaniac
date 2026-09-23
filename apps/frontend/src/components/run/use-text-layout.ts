import { useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from "react";

import { readTextLayout } from "@/components/run/text-layout";

type TextRefs = {
  scrollRef: RefObject<HTMLDivElement | null>;
  wordsRef: RefObject<HTMLDivElement | null>;
  caretRef: RefObject<HTMLSpanElement | null>;
};

const applyTextLayout = (refs: TextRefs, wordIndex: number, letterIndex: number) => {
  const scroll = refs.scrollRef.current;
  const words = refs.wordsRef.current;
  const caret = refs.caretRef.current;

  if (scroll === null || words === null || caret === null) {
    return;
  }

  const layout = readTextLayout(words, wordIndex, letterIndex);

  if (layout === null) {
    return;
  }

  scroll.style.transform = `translateY(${-layout.scrollY}px)`;
  caret.style.transform = `translate(${layout.caretX}px, ${layout.caretY}px)`;
};

// Places the caret and scrolls the Text on every Keystroke and whenever the lines reflow. The
// transforms are written to the DOM directly: a position never costs a re-render.
export const useTextLayout = (wordIndex: number, letterIndex: number): TextRefs => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    applyTextLayout({ scrollRef, wordsRef, caretRef }, wordIndex, letterIndex);
  }, [wordIndex, letterIndex]);

  const relayout = useEffectEvent(() => {
    applyTextLayout({ scrollRef, wordsRef, caretRef }, wordIndex, letterIndex);
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

  return { scrollRef, wordsRef, caretRef };
};
