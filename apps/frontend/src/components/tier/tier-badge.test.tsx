import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TIERS } from "@/components/tier/tier";
import { TierBadge } from "@/components/tier/tier-badge";

describe("TierBadge", () => {
  test("screen readers hear the tier and its division", () => {
    render(<TierBadge tier="gold" division={2} />);

    expect(screen.getByText("Or, division 2")).toBeInTheDocument();
  });

  test("each tier draws its own shape", () => {
    const tiers = TIERS;

    const emblems = tiers.map((tier) => {
      const { container, unmount } = render(<TierBadge tier={tier} division={1} />);
      const markup = container.querySelector("[data-tier-emblem]")?.innerHTML;

      unmount();

      return markup;
    });

    expect(new Set(emblems).size).toBe(tiers.length);
  });

  test("the division shows as that many bars", () => {
    const { container } = render(<TierBadge tier="maniac" division={3} />);

    expect(container.querySelectorAll("[data-division-bar]")).toHaveLength(3);
  });
});
