// Step 1, slow and run once: SCOWL's common words, counted in Google Books Ngram, written to
// data/counts.tsv (`word<TAB>matches`, most frequent first). `bun run generate` starts from there.
import { writeFileSync } from "node:fs";

import { countWords } from "./ngram";
import { countsFile } from "./paths";
import { fetchScowl, scowlCandidates } from "./scowl";

await fetchScowl();

const candidates = scowlCandidates();

console.log(`${candidates.size} SCOWL candidates, counting them in Google Books Ngram…`);

const counts = await countWords(candidates);

const lines = [...counts]
  .toSorted(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
  .map(([word, count]) => `${word}\t${count}`);

writeFileSync(countsFile, `${lines.join("\n")}\n`);

console.log(`${lines.length} words written to ${countsFile}`);
