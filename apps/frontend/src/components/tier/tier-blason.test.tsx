import { render } from "@testing-library/react";
import { TIERS } from "ranked";
import { describe, expect, test } from "vitest";

import { TierBlason } from "@/components/tier/tier-blason";
import { TierOrnament } from "@/components/tier/tier-ornament";

const hrefs = (container: HTMLElement) =>
  [...container.querySelectorAll("use")].map((use) => use.getAttribute("href"));

describe("TierBlason", () => {
  test.each(TIERS)("lays the Emblem of %s on its Ornament", (tier) => {
    const { container } = render(<TierBlason tier={tier} />);

    // The Ornament first, so the Emblem is drawn over it.
    expect(hrefs(container)).toEqual([`#tier-ornament-${tier}`, `#tier-emblem-${tier}`]);
  });

  test("is only seen", () => {
    const { container } = render(<TierBlason tier="diamant" />);

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("TierOrnament", () => {
  test.each(TIERS)("draws the Ornament of %s alone, overflowing its box", (tier) => {
    const { container } = render(<TierOrnament tier={tier} />);

    expect(hrefs(container)).toEqual([`#tier-ornament-${tier}`]);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("overflow-visible");
  });
});
