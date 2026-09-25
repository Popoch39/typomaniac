import { describe, expect, test } from "vitest";

import { type ReplaySide, viewedSides } from "@/components/replay/replay-sides";

// SAFETY: viewedSides only moves the sides around, never reads them.
const own = { score: null } as ReplaySide;

// SAFETY: viewedSides only moves the sides around, never reads them.
const opponent = { score: null } as ReplaySide;

describe("viewed sides", () => {
  test("shows the User's Run with their opponent's caret", () => {
    const { shown, shownSide, caretSide } = viewedSides({ own, opponent }, "own");

    expect(shown).toBe(own);
    expect(shownSide).toBe("own");
    expect(caretSide).toBe(opponent);
  });

  test("shows the opponent's Run with the User's caret", () => {
    const { shown, shownSide, caretSide } = viewedSides({ own, opponent }, "opponent");

    expect(shown).toBe(opponent);
    expect(shownSide).toBe("opponent");
    expect(caretSide).toBe(own);
  });

  test("shows the User's Run alone once their opponent is deleted", () => {
    const { shown, shownSide, caretSide } = viewedSides({ own, opponent: null }, "opponent");

    expect(shown).toBe(own);
    expect(shownSide).toBe("own");
    expect(caretSide).toBeNull();
  });
});
