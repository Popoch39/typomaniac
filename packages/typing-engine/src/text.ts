import { mulberry32 } from "./prng";
import { enV1 } from "./words/en-v1";
import { enV2 } from "./words/en-v2";
import { frV1 } from "./words/fr-v1";

// French is written without accents, so a Text types the same on every keyboard.
export type Language = "fr" | "en";

// Words sharing a weight: a word of weight 4 is drawn four times as often as one of weight 1.
export type WeightGroup = { readonly weight: number; readonly words: readonly string[] };

// A Word list version fixes how a Text is drawn: its words, the weight of each, and how many of
// the last drawn words are held back from the next draw.
type Draw = {
  readonly words: readonly string[];
  readonly weights: readonly number[];
  readonly total: number;
  readonly heldBack: number;
};

const drawFrom = (groups: readonly WeightGroup[], heldBack: number): Draw => {
  const weights = groups.flatMap(({ weight, words }) => words.map(() => weight));

  return {
    words: groups.flatMap(({ words }) => words),
    weights,
    total: weights.reduce((sum, weight) => sum + weight, 0),
    heldBack,
  };
};

// Word list version n of a Language is at index n - 1. A released version is never edited: a
// change is a new version appended here, and the old ones stay so recorded Keystrokes still replay.
const versions: Readonly<Record<Language, readonly Draw[]>> = {
  en: [
    // Version 1: every word as likely, never twice in a row.
    drawFrom([{ weight: 1, words: enV1 }], 1),
    // Version 2: weighted by frequency, a word back only once three others were drawn.
    drawFrom(enV2, 3),
  ],
  fr: [drawFrom([{ weight: 1, words: frV1 }], 1)],
};

// The newest Word list version of each Language: a Run or a Duel can be on any version up to it.
export const latestWordListVersion: Readonly<Record<Language, number>> = {
  en: versions.en.length,
  fr: versions.fr.length,
};

// The Word list version a new Text is drawn from, per Language. It lags behind the latest while a
// new version ships to every client first, so none receives a Text it cannot build.
export const currentWordListVersion: Readonly<Record<Language, number>> = {
  en: 1,
  fr: 1,
};

const drawOfVersion = (language: Language, version: number) => {
  const draw = versions[language][version - 1];

  if (typeof draw === "undefined") {
    throw new RangeError(`No word list version ${version} for ${language}`);
  }

  return draw;
};

export const wordList = (language: Language, version: number) =>
  drawOfVersion(language, version).words;

// SAFETY: only called with the index of a word, and weights has one entry per word.
const weightOf = (weights: readonly number[], index: number) => weights[index] as number;

// Words are drawn one by one from the Seed's sequence: the word at index i only depends on
// (Seed, Language, Word list version, i), so a longer Text starts with the shorter one. All in
// integers, so the browser and the server always draw the same word.
export const generateText = (seed: number, language: Language, version: number, count: number) => {
  const { words, weights, total, heldBack } = drawOfVersion(language, version);
  const next = mulberry32(seed);
  const text: string[] = [];
  const recentlyDrawn: number[] = [];

  for (let i = 0; i < count; i++) {
    // Draw a point on the weights of the words left once the recent ones are held back, then walk
    // them up to that point. With every weight at 1 and only the previous word held back, this is
    // the draw of version 1: the point is the index, shifted past the previous word.
    const weightHeldBack = recentlyDrawn.reduce((sum, index) => sum + weightOf(weights, index), 0);
    let point = Math.floor(next() * (total - weightHeldBack));
    let index = -1;

    while (point >= 0) {
      index += 1;

      if (!recentlyDrawn.includes(index)) {
        point -= weightOf(weights, index);
      }
    }

    // SAFETY: point started below the weights left, so the walk stops on a word in the list.
    text.push(words[index] as string);
    recentlyDrawn.push(index);

    if (recentlyDrawn.length > heldBack) {
      recentlyDrawn.shift();
    }
  }

  return text;
};
