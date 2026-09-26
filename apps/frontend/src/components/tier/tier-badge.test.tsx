import { render, screen } from "@testing-library/react";
import { TIERS } from "ranked";
import { describe, expect, test } from "vitest";

import { TierBadge } from "@/components/tier/tier-badge";

describe("TierBadge", () => {
  test("screen readers hear the Tier and its Division", () => {
    render(<TierBadge standing={{ tier: "or", division: 2, tp: 0, shielded: false }} />);

    expect(screen.getByText("Or II")).toBeInTheDocument();
  });

  test("each Tier draws its own shape", () => {
    const emblems = TIERS.map((tier) => {
      const { container, unmount } = render(
        <TierBadge
          standing={
            tier === "maniac"
              ? { tier, tp: 0, shielded: false }
              : { tier, division: 1, tp: 0, shielded: false }
          }
        />,
      );

      const markup = container.querySelector("[data-tier-emblem]")?.innerHTML;

      unmount();

      return markup;
    });

    expect(new Set(emblems).size).toBe(TIERS.length);
  });

  test("the Division shows as bars: one for IV, four for I", () => {
    const { container, rerender } = render(
      <TierBadge standing={{ tier: "fer", division: 4, tp: 0, shielded: false }} />,
    );

    expect(container.querySelectorAll("[data-division-bar]")).toHaveLength(1);
    rerender(<TierBadge standing={{ tier: "fer", division: 1, tp: 0, shielded: false }} />);
    expect(container.querySelectorAll("[data-division-bar]")).toHaveLength(4);
  });

  test("Maniac has no Division", () => {
    const { container } = render(
      <TierBadge standing={{ tier: "maniac", tp: 0, shielded: false }} />,
    );

    expect(container.querySelectorAll("[data-division-bar]")).toHaveLength(0);
    expect(screen.getByText("Maniac")).toBeInTheDocument();
  });
});
