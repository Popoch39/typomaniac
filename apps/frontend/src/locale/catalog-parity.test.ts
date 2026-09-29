import { describe, expect, test } from "vitest";

import { locales } from "@/locale/locales";

// The catalogs Paraglide compiles, messages/<locale>.json, as written.
const catalogs = import.meta.glob<string>("/messages/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Each message of a catalog, by key, with the variables it takes: its placeholders ({count}) and,
// for a message with variants, its declared inputs ("input count").
const messageVariables = (catalog: string) =>
  Object.fromEntries(
    Object.entries(JSON.parse(catalog))
      .filter(([key]) => key !== "$schema")
      .map(([key, message]) => {
        const text = JSON.stringify(message);
        const placeholders = Array.from(text.matchAll(/\{(\w+)\}/g), ([, name]) => name);
        const inputs = Array.from(text.matchAll(/input (\w+)/g), ([, name]) => name);

        return [key, [...new Set([...placeholders, ...inputs])].toSorted()];
      }),
  );

const catalogOf = (locale: string) => catalogs[`/messages/${locale}.json`] ?? "{}";

describe("the catalogs", () => {
  test("there is one per Locale", () => {
    expect(Object.keys(catalogs).toSorted()).toEqual(
      locales.map((locale) => `/messages/${locale}.json`).toSorted(),
    );
  });

  test("every Locale has the same messages, each with the same variables", () => {
    const [first, ...others] = locales.map((locale) => messageVariables(catalogOf(locale)));

    for (const other of others) {
      expect(other).toEqual(first);
    }
  });

  test("a message or a variable missing from one Locale shows", () => {
    const en = messageVariables('{ "a": "Hi {name}", "b": "Bye" }');

    expect(messageVariables('{ "a": "Salut" , "b": "Au revoir" }')).not.toEqual(en);
    expect(messageVariables('{ "a": "Salut {name}" }')).not.toEqual(en);
    expect(messageVariables('{ "a": "Salut {name}", "b": "Au revoir" }')).toEqual(en);
  });
});
