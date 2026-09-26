import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { UserAvatar } from "@/components/user-avatar/user-avatar";

// jsdom never loads an image: this one reads as decoded, so Base UI shows it.
const imagesLoad = () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(64);
};

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
});
