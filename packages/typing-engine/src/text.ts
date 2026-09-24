import { mulberry32 } from "./prng";
import { enV1 } from "./words/en-v1";
import { frV1 } from "./words/fr-v1";

// French is written without accents, so a Text types the same on every keyboard.
export type Language = "fr" | "en";

// Word list version n of a Language is at index n - 1. A released list is never edited: a change
// is a new version appended here, and the old ones stay so recorded Keystrokes still replay.
const versions: Readonly<Record<Language, readonly (readonly string[])[]>> = {
  en: [enV1],
  fr: [frV1],
};

// The Word list version a new Text is drawn from, per Language.
export const currentWordListVersion: Readonly<Record<Language, number>> = {
  en: versions.en.length,
  fr: versions.fr.length,
};

export const wordList = (language: Language, version: number) => {
  const words = versions[language][version - 1];

  if (typeof words === "undefined") {
    throw new RangeError(`No word list version ${version} for ${language}`);
  }

  return words;
};

// Words are drawn one by one from the Seed's sequence: the word at index i only depends on
// (Seed, Language, Word list version, i), so a longer Text starts with the shorter one.
export const generateText = (seed: number, language: Language, version: number, count: number) => {
  const words = wordList(language, version);
  const next = mulberry32(seed);
  const text: string[] = [];
  let previous = -1;

  for (let i = 0; i < count; i++) {
    // After the first word, draw among the other words only, then skip over the previous one:
    // two consecutive words always differ, with one draw per word.
    const choices = previous === -1 ? words.length : words.length - 1;
    const drawn = Math.floor(next() * choices);
    const index = previous !== -1 && drawn >= previous ? drawn + 1 : drawn;

    // SAFETY: next() is in [0, 1), so index is in [0, words.length).
    text.push(words[index] as string);
    previous = index;
  }

  return text;
};
