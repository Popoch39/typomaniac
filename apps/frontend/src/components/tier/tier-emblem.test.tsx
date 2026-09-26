import { render } from "@testing-library/react";
import { TIERS } from "ranked";
import { describe, expect, test } from "vitest";

import { TierEmblem } from "@/components/tier/tier-emblem";

describe("TierEmblem", () => {
  test.each(TIERS)("draws the Emblem of %s from the sprite", (tier) => {
    const { container } = render(<TierEmblem tier={tier} />);

    expect(container.querySelector("use")?.getAttribute("href")).toBe(`#tier-emblem-${tier}`);
  });

  test("fills the box its caller gives it, only seen", () => {
    const { container } = render(<TierEmblem tier="or" />);
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("class")).toContain("size-full");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  test("never carries the Ornament", () => {
    const { container } = render(<TierEmblem tier="or" />);

    expect(container.querySelector('use[href^="#tier-ornament"]')).toBeNull();
  });
});
