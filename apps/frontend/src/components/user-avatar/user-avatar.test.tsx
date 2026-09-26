import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { UserAvatar } from "@/components/user-avatar/user-avatar";

// jsdom never loads an image: this one reads as decoded, so Base UI shows it.
const imagesLoad = () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(64);
};

const ornamentOf = (container: HTMLElement) => container.querySelector("[data-ornament]");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UserAvatar", () => {
  test("shows the User's image when they have one", () => {
    imagesLoad();
    const { container } = render(<UserAvatar handle="ada" image="https://example.com/ada.png" />);

    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://example.com/ada.png");
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  test("falls back on the initials of their Handle without one", () => {
    const { container } = render(<UserAvatar handle="ada lovelace" image={null} />);

    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  test("comes in the small size", () => {
    const { container } = render(<UserAvatar handle="ada" image={null} size="sm" />);

    expect(container.querySelector("[data-slot=avatar]")?.getAttribute("data-size")).toBe("sm");
  });

  describe("the Ornament", () => {
    test("lies behind the avatar, twice its size, never catching the pointer", () => {
      const { container } = render(<UserAvatar handle="ada" image={null} ornament="platine" />);
      const ornament = ornamentOf(container);

      expect(ornament?.querySelector("use")?.getAttribute("href")).toBe("#tier-ornament-platine");
      expect(ornament?.getAttribute("class")).toContain("pointer-events-none");
      expect(ornament?.getAttribute("class")).toContain("-z-10");
      expect(ornament?.getAttribute("class")).toContain("size-[200%]");
      // Behind its siblings, never behind what holds the avatar.
      expect(container.querySelector("[data-slot=avatar]")?.getAttribute("class")).toContain(
        "isolate",
      );
    });

    test("is absent without one", () => {
      const { container } = render(<UserAvatar handle="ada" image={null} ornament={null} />);

      expect(ornamentOf(container)).toBeNull();
    });

    test("is never worn in the small size", () => {
      const { container } = render(
        <UserAvatar handle="ada" image={null} ornament="maniac" size="sm" />,
      );

      expect(ornamentOf(container)).toBeNull();
    });
  });
});
