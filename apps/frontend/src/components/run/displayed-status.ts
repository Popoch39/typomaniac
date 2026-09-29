import type { Letter, RunWord } from "typing-engine";

// A letter still pending once its word is validated was skipped: it shows as missed. The engine
// has no such status, `missed` only exists on screen.
export const displayedStatus = (letter: Letter, validated: boolean) =>
  validated && letter.status === "pending" ? "missed" : letter.status;

// A word typed so far that differs from its target: a wrong, an extra or a missing letter.
export const isTypedWrong = (word: RunWord) => word.typed !== "" && word.typed !== word.target;

// A Wrong word: validated with a mistake left. The word being typed can still take it back.
export const isWrongWord = (word: RunWord, validated: boolean) => validated && isTypedWrong(word);
