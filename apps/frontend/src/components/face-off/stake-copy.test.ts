import type { Standing } from "ranked";
import { describe, expect, test } from "vitest";

import { stakeCopy } from "@/components/face-off/stake-copy";

const or = (division: 1 | 2 | 3 | 4, tp: number, shielded = false): Standing => ({
  tier: "or",
  division,
  tp,
  shielded,
});

const ferIv = (tp: number): Standing => ({ tier: "fer", division: 4, tp, shielded: false });

const maniac = (tp: number): Standing => ({ tier: "maniac", tp, shielded: false });

describe("the Stake's words", () => {
  test("an ordinary Duel: « En jeu », where a win leads, a loss only its TP", () => {
    expect(
      stakeCopy(or(2, 50), {
        win: { tp: 14, standing: or(2, 64) },
        loss: { tp: -11, standing: or(2, 39) },
      }),
    ).toEqual({ promotion: null, win: " → Or II · 64 TP", loss: "" });
  });

  test("a loss that moves down says where it leads", () => {
    expect(
      stakeCopy(or(2, 8), {
        win: { tp: 12, standing: or(2, 20) },
        loss: { tp: -12, standing: or(3, 75) },
      }).loss,
    ).toBe(" → Or III · 75 TP");
  });

  test("a loss the shield of a move up holds keeps the Division", () => {
    expect(
      stakeCopy(or(2, 4, true), {
        win: { tp: 12, standing: or(2, 16, true) },
        loss: { tp: -12, standing: or(2, 0) },
      }).loss,
    ).toBe(", protégé : tu restes Or II");
  });

  test("a loss down to exactly 0 TP is ordinary: the shield did not hold it", () => {
    expect(
      stakeCopy(or(2, 12, true), {
        win: { tp: 12, standing: or(2, 24, true) },
        loss: { tp: -12, standing: or(2, 0) },
      }).loss,
    ).toBe("");
  });

  test("in Fer IV, a loss below 0 TP stays at 0: nothing lies below", () => {
    expect(
      stakeCopy(ferIv(6), {
        win: { tp: 14, standing: ferIv(20) },
        loss: { tp: -12, standing: ferIv(0) },
      }).loss,
    ).toBe(", tu restes Fer IV · 0 TP");
  });

  test("a Duel a win moves up: the rank aimed at, and the one a loss keeps", () => {
    expect(
      stakeCopy(or(1, 92), {
        win: { tp: 14, standing: { tier: "platine", division: 4, tp: 6, shielded: true } },
        loss: { tp: -11, standing: or(1, 81) },
      }),
    ).toEqual({
      promotion: { tier: "platine", division: 4, tp: 6, shielded: true },
      win: " → Platine IV · 6 TP",
      loss: ", tu restes Or I",
    });
  });

  test("in Maniac, TP without a cap: « En jeu », a win and a loss as ordinary", () => {
    expect(
      stakeCopy(maniac(248), {
        win: { tp: 11, standing: maniac(259) },
        loss: { tp: -11, standing: maniac(237) },
      }),
    ).toEqual({ promotion: null, win: " → Maniac · 259 TP", loss: "" });
  });

  test("a loss that moves down from Maniac leads to Diamant I at 75 TP", () => {
    expect(
      stakeCopy(maniac(5), {
        win: { tp: 11, standing: maniac(16) },
        loss: { tp: -11, standing: { tier: "diamant", division: 1, tp: 75, shielded: false } },
      }).loss,
    ).toBe(" → Diamant I · 75 TP");
  });
});
