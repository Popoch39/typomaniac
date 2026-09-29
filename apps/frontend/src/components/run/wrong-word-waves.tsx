import type { RunWord } from "typing-engine";

import { mistakeRuns } from "@/components/run/displayed-status";
import { WrongWordWave } from "@/components/run/wrong-word-wave";

type WrongWordWavesProps = {
  word: RunWord;
  // True on a Wrong word; false on a word still being typed, reopened ones included.
  drawn: boolean;
  // Where the word's letters start and its baseline is, in its box.
  className: string;
};

// A Wrong word's waves: one under each run of its mistakes, never under its right letters.
export const WrongWordWaves = ({ word, drawn, className }: WrongWordWavesProps) =>
  mistakeRuns(word).map((run) => (
    <WrongWordWave key={run.start} run={run} drawn={drawn} className={className} />
  ));
