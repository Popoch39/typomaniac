import { describe, expect, test } from "bun:test";

import { parseHandle, suggestHandle } from "./index";

describe("suggestHandle", () => {
  test("lowercases the name and joins its words with underscores", () => {
    expect(suggestHandle("Grace Hopper")).toBe("grace_hopper");
    expect(suggestHandle("  Ada   Lovelace-King ")).toBe("ada_lovelace_king");
  });

  test("drops the accents", () => {
    expect(suggestHandle("Zoé Ménard")).toBe("zoe_menard");
  });

  test("cuts a long name to 20 characters, without a trailing underscore", () => {
    expect(suggestHandle("Alexandra Montgomery Smith")).toBe("alexandra_montgomery");
    expect(suggestHandle("Bartholomew Jones Wilkinson")).toBe("bartholomew_jones_wi");
    expect(suggestHandle("Abcdefghijklmnopqrs Tuv")).toBe("abcdefghijklmnopqrs");
  });

  test("is always a valid Handle", () => {
    expect(suggestHandle("Al")).toBe("al_");
    expect(suggestHandle("李")).toBe("typist");
    expect(suggestHandle("Admin")).toBe("admin_");

    for (const name of ["Al", "李", "Admin", "Zoé Ménard", "x".repeat(40)]) {
      expect(parseHandle(suggestHandle(name)).ok).toBe(true);
    }
  });
});

describe("parseHandle", () => {
  test("accepts 3 to 20 lowercase letters, digits and underscores", () => {
    expect(parseHandle("ada")).toEqual({ ok: true, handle: "ada" });
    expect(parseHandle("grace_hopper_1906")).toEqual({ ok: true, handle: "grace_hopper_1906" });
    expect(parseHandle("a".repeat(20))).toEqual({ ok: true, handle: "a".repeat(20) });
  });

  test("is case-insensitive: the Handle is lowercased", () => {
    expect(parseHandle("PoPoch")).toEqual({ ok: true, handle: "popoch" });
  });

  test("refuses fewer than 3 characters", () => {
    expect(parseHandle("ab")).toEqual({ ok: false, reason: "too-short" });
    expect(parseHandle("")).toEqual({ ok: false, reason: "too-short" });
  });

  test("refuses more than 20 characters", () => {
    expect(parseHandle("a".repeat(21))).toEqual({ ok: false, reason: "too-long" });
  });

  test("refuses any character but a-z, 0-9 and _, before its length", () => {
    expect(parseHandle("ada lovelace")).toEqual({ ok: false, reason: "invalid-chars" });
    expect(parseHandle("zoé")).toEqual({ ok: false, reason: "invalid-chars" });
    expect(parseHandle("a-b")).toEqual({ ok: false, reason: "invalid-chars" });
    expect(parseHandle("é")).toEqual({ ok: false, reason: "invalid-chars" });
  });

  test("refuses a reserved Handle, whatever its case", () => {
    expect(parseHandle("admin")).toEqual({ ok: false, reason: "reserved" });
    expect(parseHandle("TypoManiac")).toEqual({ ok: false, reason: "reserved" });
  });
});
