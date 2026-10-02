// SCOWL v1, the last release that still has sizes 10 and 20 (the most common words): downloaded
// once into .cache, then read from its `final/` and `misc/` lists.
import { existsSync, mkdirSync, readFileSync } from "node:fs";

import { cacheDir } from "./paths";

const release = "2020.12.07";

const archiveUrl = `https://downloads.sourceforge.net/project/wordlist/SCOWL/${release}/scowl-${release}.tar.gz`;

const scowlDir = `${cacheDir}/scowl-${release}`;

// American spelling: the words shared by every dialect, then the American ones.
const spellings = ["english", "american"];

const sizes = [10, 20];

// Vulgar words and slurs, kept apart by SCOWL itself.
const blocklists = ["profane.1", "profane.3", "offensive.1", "offensive.2"];

// What a Text can hold: lowercase a to z only, from 2 to 10 letters.
const isTypable = (word: string) => /^[a-z]{2,10}$/.test(word);

export const fetchScowl = async () => {
  if (existsSync(scowlDir)) {
    return;
  }

  mkdirSync(cacheDir, { recursive: true });
  const archive = `${cacheDir}/scowl-${release}.tar.gz`;
  const response = await fetch(archiveUrl);

  if (!response.ok) {
    throw new Error(`SCOWL download failed: ${response.status}`);
  }

  await Bun.write(archive, response);
  const tar = Bun.spawnSync(["tar", "-xzf", archive, "-C", cacheDir]);

  if (tar.exitCode !== 0) {
    throw new Error(`SCOWL extraction failed: ${tar.stderr.toString()}`);
  }
};

// SCOWL's lists are Latin-1, one word per line.
const readList = (path: string) => readFileSync(path, "latin1").split("\n");

// Every SCOWL word of sizes 10 and 20 that a Text can hold, minus the blocklists.
export const scowlCandidates = () => {
  const blocked = new Set(blocklists.flatMap((name) => readList(`${scowlDir}/misc/${name}`)));

  const lists = sizes.flatMap((size) =>
    spellings.map((spelling) => `${scowlDir}/final/${spelling}-words.${size}`),
  );

  const words = lists.flatMap(readList).filter((word) => word !== "");
  const typable = words.filter(isTypable);
  const kept = typable.filter((word) => !blocked.has(word));

  console.log(
    `SCOWL: ${words.length} words, ${words.length - typable.length} not [a-z] of 2 to 10 letters, ${typable.length - kept.length} on a blocklist`,
  );

  return new Set(kept.toSorted());
};
