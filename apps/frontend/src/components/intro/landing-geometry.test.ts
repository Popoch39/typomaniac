import { describe, expect, test } from "vitest";

import { DIVE_SCALE, landingGeometry } from "@/components/intro/landing-geometry";

// The board's scene, 1440 × 900: the sidebar 12 px in, its brand's Logo at 24 / 32, 36 px, and its
// word 42 px right of it. The lockup typed, its left edge and top at the Logo's place in the
// middle of the screen.
const measures = {
  lockup: { left: 669.6, top: 399.6 },
  logoTop: 0,
  sidebar: { left: 12, top: 12, width: 256, height: 876 },
  brandLogo: { left: 30, top: 32, width: 36, height: 36 },
  brandWord: { left: 72, top: 38, width: 118, height: 25 },
};

describe("where the lockup lands, and where the sidebar grows from", () => {
  test("the lockup's Logo lands on the brand's, at a 2.8th of its size", () => {
    const { dive } = landingGeometry(measures);
    const landedLogoTop = measures.lockup.top + dive.y + measures.logoTop * DIVE_SCALE;

    expect(DIVE_SCALE * 100.8).toBeCloseTo(36);
    expect(measures.lockup.left + dive.x).toBe(measures.brandLogo.left);
    expect(landedLogoTop).toBeCloseTo(measures.brandLogo.top);
  });

  test("a Logo lower in the lockup lands as high as the brand's all the same", () => {
    const { dive } = landingGeometry({ ...measures, logoTop: 14 });

    expect(measures.lockup.top + dive.y + 14 * DIVE_SCALE).toBeCloseTo(measures.brandLogo.top);
  });

  test("the sidebar grows from the brand's footprint, 6 px of air around, 8 px right of the word", () => {
    const { clipFrom, clipTo } = landingGeometry(measures);

    // Top 32 − 12 − 6, right 256 − (72 − 12 + 118 + 8), bottom 876 − (32 − 12 + 36 + 6), left
    // 30 − 12 − 6.
    expect(clipFrom).toBe("inset(14px 70px 814px 12px round 14px)");
    expect(clipTo).toBe("inset(0px 0px 0px 0px round 28px)");
  });

  test("the Rail, without the word, grows from the Logo's footprint alone, 6 px of air around", () => {
    const rail = {
      ...measures,
      sidebar: { left: 12, top: 12, width: 68, height: 876 },
      brandLogo: { left: 28, top: 32, width: 36, height: 36 },
      brandWord: null,
    };

    const { clipFrom, dive } = landingGeometry(rail);

    // Top 32 − 12 − 6, right 68 − (28 − 12 + 36 + 6), bottom 876 − (32 − 12 + 36 + 6), left
    // 28 − 12 − 6.
    expect(clipFrom).toBe("inset(14px 10px 814px 10px round 14px)");
    expect(measures.lockup.left + dive.x).toBe(28);
  });
});
