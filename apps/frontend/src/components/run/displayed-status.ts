import type { Letter, RunWord } from "typing-engine";

// A letter still pending once its word is validated was skipped: it shows as missed. The engine
// has no such status, `missed` only exists on screen.
export const displayedStatus = (letter: Letter, validated: boolean) =>
  validated && letter.status === "pending" ? "missed" : letter.status;

// A word typed so far that differs from its target: a wrong, an extra or a missing letter.
export const isTypedWrong = (word: RunWord) => word.typed !== "" && word.typed !== word.target;

// A Wrong word: validated with a mistake left. The word being typed can still take it back.
export const isWrongWord = (word: RunWord, validated: boolean) => validated && isTypedWrong(word);

// Letters of a word that follow each other: the first one's index, and how many.
export type LetterRun = { start: number; letters: number };

// A word's mistakes as a Wrong word shows them: its wrong, extra and skipped letters, those that
// follow each other in one run. Read as if validated, so a word reopened keeps the runs it showed.
export const mistakeRuns = (word: RunWord) => {
  const runs: LetterRun[] = [];

  for (const letter of word.letters) {
    const last = runs.at(-1);

    if (displayedStatus(letter, true) === "correct") {
      continue;
    }

    if (last !== undefined && last.start + last.letters === letter.index) {
      last.letters += 1;
    } else {
      runs.push({ start: letter.index, letters: 1 });
    }
  }

  return runs;
};
