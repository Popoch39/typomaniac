import { mulberry32 } from "./prng";
import { en } from "./words/en";

export type Language = "en";

export const wordLists: Readonly<Record<Language, readonly string[]>> = { en };

// Words are drawn one by one from the Seed's sequence: the word at index i only depends on
// (Seed, Language, i), so a longer Text starts with the shorter one.
export const generateText = (seed: number, language: Language, count: number) => {
  const words = wordLists[language];
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
