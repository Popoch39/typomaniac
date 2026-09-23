// Where the caret goes and how far the Text scrolls, read from the rendered words. Offsets are
// relative to the element that holds both the words and the caret (their offset parent).
export type TextLayout = { caretX: number; caretY: number; scrollY: number };

// The caret sits before the current letter, or after the last one (extra letters included)
// once the word is typed. The Text scrolls one line at a time so the current line is never below
// the second of the three visible ones.
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
  const last = word.lastElementChild;
  // Flex items without a row gap: a word is exactly one line high.
  const lineHeight = word.offsetHeight;
  const line = lineHeight === 0 ? 0 : Math.round(word.offsetTop / lineHeight);

  const caretX =
    letter instanceof HTMLElement
      ? letter.offsetLeft
      : last instanceof HTMLElement
        ? last.offsetLeft + last.offsetWidth
        : word.offsetLeft;

  return { caretX, caretY: word.offsetTop, scrollY: Math.max(0, line - 1) * lineHeight };
};
