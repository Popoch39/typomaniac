# Third-party notices

## English Word list version 2

`packages/typing-engine/src/words/en-v2.ts` is built by `tools/word-list` from the two sources below (ADR 0019). `tools/word-list/data/counts.tsv` holds the counts it reads from Google Books Ngram.

### SCOWL (Spell Checker Oriented Word Lists)

http://wordlist.aspell.net, release 2020.12.07, sizes 10 and 20, English and American spelling.

> Copyright 2000-2018 by Kevin Atkinson
>
> Permission to use, copy, modify, distribute and sell these word lists, the associated scripts, the output created from the scripts, and its documentation for any purpose is hereby granted without fee, provided that the above copyright notice appears in all copies and that both that copyright notice and this permission notice appear in supporting documentation. Kevin Atkinson makes no representations about the suitability of this array for any purpose. It is provided "as is" without express or implied warranty.

### Google Books Ngram

Word frequencies from the English 1-grams of the Google Books Ngram Viewer (http://books.google.com/ngrams), version 3 (2020-02-17), occurrences from 2000 to 2019. The dataset is licensed under a [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/). The counts were summed per word, case folded, and only the SCOWL words were kept.
