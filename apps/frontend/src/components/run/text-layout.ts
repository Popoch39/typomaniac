// Where the caret goes and how far the Text scrolls, read from the rendered words. Offsets are
// relative to the element that holds both the words and the caret (the words' offset parent).
export type TextLayout = { caretX: number; caretY: number; scrollY: number };

// The caret sits before the current letter, or after the one before it (extra letters included)
// once the word is typed: the word's wave comes after its letters. A word places its wave, so it is
// its letters' offset parent. The Text scrolls one line at a time so the current line is never
// below the second of the three visible ones.
export const readTextLayout = (
  words: HTMLElement,
  wordIndex: number,
  letterIndex: number,
): TextLayout | null => {
  const word = words.children[wordIndex];

  if (!(word instanceof HTMLElement)) {
    return null;
  }

  const letter = word.children[letterIndex];
  const before = word.children[letterIndex - 1];
  // Flex items without a row gap: a word is exactly one line high.
  const lineHeight = word.offsetHeight;
  const line = lineHeight === 0 ? 0 : Math.round(word.offsetTop / lineHeight);

  const inWord =
    letter instanceof HTMLElement
      ? letter.offsetLeft
      : before instanceof HTMLElement
        ? before.offsetLeft + before.offsetWidth
        : 0;

  return {
    caretX: word.offsetLeft + inWord,
    caretY: word.offsetTop,
    scrollY: Math.max(0, line - 1) * lineHeight,
  };
};
