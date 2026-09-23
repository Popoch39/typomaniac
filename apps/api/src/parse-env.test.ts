import { describe, expect, test } from "bun:test";

import { parseEnv } from "./parse-env";

describe("parseEnv", () => {
  test("reads DATABASE_URL and converts PORT to a number", () => {
    const env = parseEnv({ DATABASE_URL: "postgres://u:p@localhost:5434/db", PORT: "4000" });

    expect(env).toEqual({ DATABASE_URL: "postgres://u:p@localhost:5434/db", PORT: 4000 });
  });

  test("defaults PORT to 3000", () => {
    expect(parseEnv({ DATABASE_URL: "postgres://localhost/db" }).PORT).toBe(3000);
  });

  test("throws when DATABASE_URL is missing", () => {
    expect(() => parseEnv({ PORT: "3000" })).toThrow();
  });
});
