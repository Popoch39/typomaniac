// Downloads stay out of git, the counts and the curation are committed.
export const cacheDir = new URL("../.cache", import.meta.url).pathname;

export const countsFile = new URL("../data/counts.tsv", import.meta.url).pathname;

export const excludedFile = new URL("../data/excluded.txt", import.meta.url).pathname;

export const outputFile = new URL(
  "../../../packages/typing-engine/src/words/en-v2.ts",
  import.meta.url,
).pathname;
