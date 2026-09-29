import { describe, expect, test } from "vitest";

import {
  dateFormat,
  numberFormat,
  ordinal,
  pluralRules,
  relativeTimeFormat,
} from "@/locale/formats";

// The no-break spaces of French: the narrow one between thousands, the full one before "%".
const NBSP = " ";

const NNBSP = " ";

describe("numberFormat", () => {
  test("groups the thousands the way each Locale does", () => {
    expect(numberFormat("en").format(1284)).toBe("1,284");
    expect(numberFormat("fr").format(1284)).toBe(`1${NNBSP}284`);
  });

  test("writes the decimals the way each Locale does", () => {
    const tenths = { maximumFractionDigits: 1 };

    expect(numberFormat("en", tenths).format(3.14)).toBe("3.1");
    expect(numberFormat("fr", tenths).format(3.14)).toBe("3,1");
  });

  test("sticks the percent sign in English, not in French", () => {
    expect(numberFormat("en", { style: "percent" }).format(0.97)).toBe("97%");
    expect(numberFormat("fr", { style: "percent" }).format(0.97)).toBe(`97${NBSP}%`);
  });

  test("is made once per Locale and options", () => {
    expect(numberFormat("en", { style: "percent" })).toBe(numberFormat("en", { style: "percent" }));
    expect(numberFormat("en")).not.toBe(numberFormat("fr"));
  });
});

describe("dateFormat", () => {
  test("writes a US date in English, a French one in French", () => {
    const day = new Date(2026, 8, 29);

    expect(dateFormat("en", { dateStyle: "medium" }).format(day)).toBe("Sep 29, 2026");
    expect(dateFormat("fr", { dateStyle: "medium" }).format(day)).toBe("29 sept. 2026");
  });
});

describe("relativeTimeFormat", () => {
  test("says how long ago in each Locale", () => {
    expect(relativeTimeFormat("en", { numeric: "auto" }).format(-2, "minute")).toBe(
      "2 minutes ago",
    );
    expect(relativeTimeFormat("fr", { numeric: "auto" }).format(-2, "minute")).toBe(
      "il y a 2 minutes",
    );
    expect(relativeTimeFormat("en", { numeric: "auto" }).format(-1, "day")).toBe("yesterday");
  });
});

describe("pluralRules", () => {
  test("follows each Locale's rules, 0 and 1 singular in French", () => {
    expect(pluralRules("en").select(0)).toBe("other");
    expect(pluralRules("en").select(1)).toBe("one");
    expect(pluralRules("fr").select(0)).toBe("one");
    expect(pluralRules("fr").select(2)).toBe("other");
  });
});

describe("ordinal", () => {
  test("in English: 1st, 2nd, 3rd, then th, the teens included", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map((n) => ordinal("en", n))).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "23rd",
      "101st",
    ]);
  });

  test("in French: 1er, then e", () => {
    expect([1, 2, 23].map((n) => ordinal("fr", n))).toEqual(["1er", "2e", "23e"]);
  });

  test("groups a large rank's thousands", () => {
    expect(ordinal("en", 1284)).toBe("1,284th");
  });
});
