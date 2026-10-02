# word-list

Builds the English Word list version 2 of the typing engine (`packages/typing-engine/src/words/en-v2.ts`, ADR 0019). Run by hand, never in CI. A released version is never rebuilt over: these scripts make a new version, or show how an old one was made.

## Steps

1. `bun run fetch`, slow, run once. It downloads SCOWL 2020.12.07 into `.cache/` (ignored by git). It keeps the words of sizes 10 and 20 (English + American) in lowercase `[a-z]` from 2 to 10 letters, minus SCOWL's `misc/profane.*` and `misc/offensive.*`. Then it downloads the 24 shards of the English 1-grams of Google Books Ngram v3 into `.cache/ngram/` (about 13 GB, more than an hour; curl resumes a dropped connection) and counts each one into a `.tsv` next to it, so a stopped run picks up where it was. Once every shard is counted, the `.gz` can be deleted. It writes to `data/counts.tsv` (committed) each word's occurrences from 2000 on, case folded, most frequent first.
2. `bun run generate` (not `build`, which turbo would run on every build of the repo) takes `data/counts.tsv`, removes the words in `data/excluded.txt`, keeps the 1,000 most frequent and writes `en-v2.ts` with their weights: the first 100 weigh 4, the next 300 weigh 2, the last 600 weigh 1, and formats it with oxfmt.

## Curation

`data/excluded.txt` lists, one per line followed by `# why`, the frequent words a Text should not hold:

- proper nouns and adjectives (english, american, christmas);
- abbreviations and letters (etc, vs, mr, ii);
- words that only make sense inside a phrase, archaic words, and words that read badly out of context.

Credits for both sources are in `THIRD-PARTY-NOTICES.md` at the root, and in the `/*! */` comment that `generate` writes at the top of the list, which the minifier keeps in the bundle.
