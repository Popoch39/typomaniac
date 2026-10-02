// Google Books Ngram v3 (CC BY 3.0): the English 1-grams, 24 gzip shards, ~13 GB in all. A line is
// `ngram<TAB>year,matches,volumes<TAB>…`; an ngram without a `_TAG` suffix holds the total over
// every part of speech, so only those are counted. Each shard is downloaded into .cache by curl,
// which resumes a dropped connection, and its counts are kept there: a run that stops picks up
// where it was.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

import { cacheDir } from "./paths";

const shardCount = 24;

const shardName = (index: number) =>
  `1-${String(index).padStart(5, "0")}-of-${String(shardCount).padStart(5, "0")}`;

const shardUrl = (index: number) =>
  `https://storage.googleapis.com/books/ngrams/books/20200217/eng/${shardName(index)}.gz`;

const ngramDir = `${cacheDir}/ngram`;

// Recent usage only: from 2000 to the corpus' last year, 2019.
const firstYear = 2000;

const downloadAttempts = 20;

const matchesSince = (years: string) => {
  let total = 0;

  for (const entry of years.split("\t")) {
    const [year, matches] = entry.split(",");

    if (Number(year) >= firstYear) {
      total += Number(matches);
    }
  }

  return total;
};

// Adds a line's matches to its word, case folded, if the word is wanted.
const countLine = (line: string, wanted: ReadonlySet<string>, counts: Map<string, number>) => {
  const tab = line.indexOf("\t");
  const word = line.slice(0, tab).toLowerCase();

  if (tab === -1 || !wanted.has(word)) {
    return;
  }

  counts.set(word, (counts.get(word) ?? 0) + matchesSince(line.slice(tab + 1)));
};

// curl resumes the partial file each attempt, so a dropped connection only costs a retry.
const download = async (index: number, attempt = 1): Promise<string> => {
  const file = `${ngramDir}/${shardName(index)}.gz`;

  if (existsSync(file)) {
    return file;
  }

  const part = `${file}.part`;

  const curl = Bun.spawn(
    [
      "curl",
      "--fail",
      "--silent",
      "--show-error",
      "--continue-at",
      "-",
      "--output",
      part,
      shardUrl(index),
    ],
    { stderr: "pipe" },
  );

  if ((await curl.exited) === 0) {
    renameSync(part, file);

    return file;
  }

  if (attempt >= downloadAttempts) {
    throw new Error(
      `Ngram shard ${index} not downloaded: ${await new Response(curl.stderr).text()}`,
    );
  }

  return download(index, attempt + 1);
};

const countShard = async (index: number, wanted: ReadonlySet<string>) => {
  const countsFile = `${ngramDir}/${shardName(index)}.tsv`;

  if (!existsSync(countsFile)) {
    const file = await download(index);
    const counts = new Map<string, number>();

    const chunks = Bun.file(file)
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
      .pipeThrough(new TextDecoderStream());

    let rest = "";

    for await (const chunk of chunks) {
      const lines = (rest + chunk).split("\n");

      rest = lines.pop() ?? "";

      for (const line of lines) {
        countLine(line, wanted, counts);
      }
    }

    countLine(rest, wanted, counts);
    writeFileSync(countsFile, [...counts].map(([word, count]) => `${word}\t${count}\n`).join(""));
    console.log(`shard ${index + 1}/${shardCount} counted`);
  }

  return readFileSync(countsFile, "utf8")
    .split("\n")
    .flatMap((line) => {
      const [word, count] = line.split("\t");

      return word ? [{ word, count: Number(count) }] : [];
    });
};

// The matches since 2000 of every wanted word, case folded; a word never seen counts 0.
export const countWords = async (wanted: ReadonlySet<string>) => {
  mkdirSync(ngramDir, { recursive: true });

  const counts = new Map<string, number>(Array.from(wanted, (word) => [word, 0]));
  let nextShard = 0;

  // Each worker takes the next shard left until none is.
  const worker = async (): Promise<void> => {
    if (nextShard >= shardCount) {
      return;
    }

    const index = nextShard;

    nextShard += 1;

    for (const { word, count } of await countShard(index, wanted)) {
      counts.set(word, (counts.get(word) ?? 0) + count);
    }

    return worker();
  };

  // A stream is slow (~0.1 MB/s): every shard downloads at once.
  await Promise.all(Array.from({ length: shardCount }, worker));

  return counts;
};
