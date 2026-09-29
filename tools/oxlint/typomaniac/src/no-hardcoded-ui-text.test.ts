import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { untranslatedFiles } from "./ui-text-scope.ts";

const repoRoot = new URL("../../../../", import.meta.url).pathname;

const config = new URL("../test/rule-only.json", import.meta.url).pathname;

const fixture = (name: string) => new URL(`../fixtures/ui-text/${name}`, import.meta.url).pathname;

interface Diagnostic {
  code: string;
  filename: string;
  labels: { span: { offset: number; length: number } }[];
}

// Lints the files with this rule alone and returns, by file, the source each diagnostic points
// at, in reading order.
const flaggedTexts = (files: string[]) => {
  const run = Bun.spawnSync(
    [`${repoRoot}node_modules/.bin/oxlint`, "-c", config, "--format", "json", ...files],
    { cwd: repoRoot },
  );

  const { diagnostics }: { diagnostics: Diagnostic[] } = JSON.parse(run.stdout.toString());

  const spans = diagnostics
    .flatMap((diagnostic) => {
      const span = diagnostic.labels[0]?.span;

      if (diagnostic.code !== "typomaniac(no-hardcoded-ui-text)" || span === undefined) return [];

      return [{ file: resolve(repoRoot, diagnostic.filename), ...span }];
    })
    .toSorted((a, b) => a.offset - b.offset);

  const byFile = new Map<string, string[]>();

  for (const { file, offset, length } of spans) {
    const hits = byFile.get(file) ?? [];

    hits.push(
      readFileSync(file)
        .subarray(offset, offset + length)
        .toString()
        .trim(),
    );
    byFile.set(file, hits);
  }

  return byFile;
};

describe("no-hardcoded-ui-text", () => {
  test("flags the text in JSX and in the text attributes", () => {
    const file = fixture("faulty.tsx");

    expect(flaggedTexts([file]).get(file)).toEqual([
      '"Barre latérale"',
      "Classement",
      '"Pas encore de Duel"',
      '"Duel classé"',
      '"Challenge"',
      "`Aucun ${count} Friend`",
      '"Couper le son"',
      '"Blason"',
      '"Chercher un User"',
      "`${count} TP sur 100`",
      '"Suivant"',
      "s",
      "3 GitHub Stars",
    ]);
  });

  test("lets through punctuation, numbers, proper names and expressions", () => {
    expect(flaggedTexts([fixture("compliant.tsx")]).size).toBe(0);
  });

  test("each exception still has hardcoded text, or it leaves the list", () => {
    const files = untranslatedFiles.map((file) => resolve(repoRoot, file));
    const hits = flaggedTexts(files);

    expect(files.filter((file) => !hits.has(file))).toEqual([]);
  });
});
