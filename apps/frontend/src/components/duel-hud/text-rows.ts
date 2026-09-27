import type { RunWord } from "typing-engine";

// The width the lines may take in the Text's card, a little under its 1104 px (1280 less the
// scene's margins and the card's padding, `DuelHud`), and the width of one character of the Text:
// JetBrains Mono's advance, 0.6 em, at the 42 px `DuelText` draws it in.
const TEXT_WIDTH = 1080;

const CHAR_WIDTH = 42 * 0.6;

// The most characters a line holds, spaces included: one short of what fits, as on the board.
const LINE_CHARS = Math.floor(TEXT_WIDTH / CHAR_WIDTH) - 1;

// How many lines of the Text are shown at once.
const SHOWN_LINES = 3;

// One line of the Text: the index of its first word, and of the word after its last.
export type TextLine = { start: number; end: number };

// The Text cut into lines of at most LINE_CHARS characters, spaces included. The words to type
// decide, never what is typed: a word never moves to another line while the User types.
export const textLines = (words: readonly RunWord[]): TextLine[] => {
  const lines: TextLine[] = [];
  let start = 0;
  let chars = 0;

  for (const word of words) {
    if (word.index > start && chars + 1 + word.target.length > LINE_CHARS) {
      lines.push({ start, end: word.index });
      start = word.index;
      chars = 0;
    }

    chars += (word.index > start ? 1 : 0) + word.target.length;
  }

  if (words.length > start) {
    lines.push({ start, end: words.length });
  }

  return lines;
};

// The lines on screen: the one holding word `wordIndex` stays the second once past the first.
export const shownLines = (lines: readonly TextLine[], wordIndex: number): TextLine[] => {
  const current = lines.findIndex((line) => wordIndex < line.end);
  const first = Math.max(0, (current === -1 ? lines.length - 1 : current) - 1);

  return lines.slice(first, first + SHOWN_LINES);
};

// Whether word `wordIndex` is on one of `lines`.
export const isOnLines = (lines: readonly TextLine[], wordIndex: number) =>
  lines.some((line) => wordIndex >= line.start && wordIndex < line.end);
