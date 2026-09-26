import { render } from "@testing-library/react";
import { TIERS } from "ranked";
import { describe, expect, test } from "vitest";

import { TierBlason } from "@/components/tier/tier-blason";
import { TierEmblem } from "@/components/tier/tier-emblem";
import { TierSprite } from "@/components/tier/tier-sprite";

// Every `url(#…)` paint and `href="#…"` reference in the page.
const references = (root: HTMLElement) =>
  [...root.querySelectorAll("*")].flatMap((element) =>
    [...element.attributes].flatMap((attribute) => {
      const match =
        attribute.name === "href"
          ? /^#([\w-]+)$/.exec(attribute.value)
          : /^url\(#([\w-]+)\)$/.exec(attribute.value);

      return match?.[1] === undefined ? [] : [match[1]];
    }),
  );

describe("TierSprite", () => {
  test("its ids stay unique however many emblems and blasons show", () => {
    const { container } = render(
      <>
        <TierSprite />
        {TIERS.map((tier) => (
          <TierEmblem key={`emblem-${tier}`} tier={tier} />
        ))}
        {TIERS.map((tier) => (
          <TierBlason key={`blason-${tier}`} tier={tier} />
        ))}
      </>,
    );

    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every reference, from the sprite or the drawings, points at one of its parts", () => {
    const { container } = render(
      <>
        <TierSprite />
        {TIERS.map((tier) => (
          <TierBlason key={tier} tier={tier} />
        ))}
      </>,
    );

    const ids = new Set([...container.querySelectorAll("[id]")].map((element) => element.id));

    expect(references(container)).toContain("tier-metal-maniac");
    expect(references(container).filter((id) => !ids.has(id))).toEqual([]);
  });

  test("it holds an Emblem and an Ornament for each Tier", () => {
    const { container } = render(<TierSprite />);

    for (const tier of TIERS) {
      expect(container.querySelector(`symbol#tier-emblem-${tier}`)).not.toBeNull();
      expect(container.querySelector(`symbol#tier-ornament-${tier}`)).not.toBeNull();
    }
  });

  test("it is never seen by screen readers", () => {
    const { container } = render(<TierSprite />);

    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
